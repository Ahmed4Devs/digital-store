<?php
declare(strict_types=1);

namespace App\DTOs;

class UserRegisterDTO {
    // PHP 8.5 Asymmetric Visibility: Readable publicly, writable only inside the class
    public private(set) string $email {
        set {
            $cleaned = strtolower(trim($value));
            if (!filter_var($cleaned, FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException("البريد الإلكتروني المدخل غير صالح.");
            }
            $this->email = $cleaned;
        }
    }

    // PHP 8.5 Property Hook: Automatically sanitizes and validates input
    public string $username {
        set {
            $cleaned = trim($value);
            if (mb_strlen($cleaned) < 3 || mb_strlen($cleaned) > 50) {
                throw new \InvalidArgumentException("اسم المستخدم يجب أن يكون بين 3 و 50 حرفاً.");
            }
            $this->username = htmlspecialchars($cleaned, ENT_QUOTES, 'UTF-8');
        }
    }

    public private(set) string $password {
        set {
            if (strlen($value) < 8) {
                throw new \InvalidArgumentException("كلمة المرور يجب ألا تقل عن 8 أحرف.");
            }
            $this->password = $value;
        }
    }

    public function __construct(string $username, string $email, string $password) {
        $this->username = $username;
        $this->email = $email;
        $this->password = $password;
    }
}
