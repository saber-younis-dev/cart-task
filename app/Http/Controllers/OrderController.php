<?php
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Events\OrderPlaced;

class OrderController extends Controller
{

    public function index()
    {
        $orders = Order::with(['products' => function($query) {
            $query->withPivot('quantity');
        }])->where('user_id', auth()->id())->get();

        return response()->json($orders, 200);

    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'products' => 'required|array|min:1',
            'products.*.id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        $total = 0;
        $orderProducts = [];
        foreach ($validated['products'] as $item) {
            $product = Product::find($item['id']);
            if ($product->stock < $item['quantity']) {
                DB::rollBack();
                return response()->json(['error' => 'Insufficient stock for product: ' . $product->name], 422);
            }
            $total += $product->price * $item['quantity'];
            $orderProducts[$product->id] = ['quantity' => $item['quantity']];
            $product->decrement('stock', $item['quantity']);
        }
        $order = Order::create([
            'user_id' => $request->user()->id,
            'total' => $total,
        ]);
        $order->products()->attach($orderProducts);
        DB::commit();

        event(new OrderPlaced($order));

        return response()->json($order->load('products'), 201);
    }

    public function show($id)
    {
        try {
            $order = Order::with(['products' => function($query) {
                $query->withPivot('quantity');
            }])->findOrFail($id);

            // Log the order data for debugging
            \Log::info('Order data for ID ' . $id . ':', ['order' => $order->toArray()]);

            return response()->json($order);
        } catch (\Exception $e) {
            \Log::error('Order details error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to retrieve order details: ' . $e->getMessage()], 500);
        }
    }
}
