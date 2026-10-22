<?php
declare(strict_types=1);

namespace App\DTOs;

class OrderCreateDTO {
    /**
     * @var array<int> Product IDs to purchase
     */
    public private(set) array $productIds;

    public function __construct(mixed $productInput) {
        $ids = [];

        if (is_numeric($productInput)) {
            $ids[] = (int)$productInput;
        } elseif (is_array($productInput)) {
            foreach ($productInput as $item) {
                if (is_numeric($item)) {
                    $ids[] = (int)$item;
                } elseif (is_array($item) && isset($item['product_id']) && is_numeric($item['product_id'])) {
                    $ids[] = (int)$item['product_id'];
                }
            }
        }

        $ids = array_values(array_unique(array_filter($ids, fn($id) => $id > 0)));

        if (empty($ids)) {
            throw new \InvalidArgumentException("يجب اختيار منتج واحد على الأقل لإتمام الطلب.");
        }

        $this->productIds = $ids;
    }
}
