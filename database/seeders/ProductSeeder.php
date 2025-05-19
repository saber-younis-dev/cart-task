<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = ['T-Shirts', 'Jeans', 'Jackets', 'Dresses', 'Shoes', 'Hats'];
        $names = [
            'Classic White T-Shirt', 'Blue Denim Jeans', 'Leather Jacket', 'Summer Dress',
            'Running Shoes', 'Baseball Cap', 'Hoodie', 'Chinos', 'Sneakers', 'Wool Sweater',
            'Polo Shirt', 'Cargo Shorts', 'Raincoat', 'Sandals', 'Beanie', 'Blazer',
            'Skirt', 'Cardigan', 'Boots', 'Tank Top'
        ];

        foreach (range(0, 19) as $i) {
            Product::create([
                'name' => $names[$i],
                'price' => rand(15, 120),
                'category' => $categories[array_rand($categories)],
                'stock' => rand(0, 100)
            ]);
        }
    }
}
