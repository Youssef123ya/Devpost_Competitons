<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hero Preview</title>
    
    <!-- Tailwind CSS -->
    <script src="/js/tailwind.js"></script>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <style>
        /* تنسيقات مخصصة للمعاينة */
        .preview-wrapper {
            background-color: #f8fafc;
            min-height: 100vh;
            padding: 2rem;
        }
        
        .preview-controls {
            position: sticky;
            top: 2rem;
        }
        
        /* تنسيقات عناصر التحكم */
        input[type="color"] {
            -webkit-appearance: none;
            padding: 0;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            cursor: pointer;
        }
        
        input[type="range"] {
            -webkit-appearance: none;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
        }
        
        /* تنسيقات القسم البطل */
        .hero {
            position: relative;
            overflow: hidden;
        }
        
        .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
        }
        
        /* تحسينات للنموذج */
        .form-group label {
            margin-bottom: 0.5rem;
            color: #374151;
        }
        
        .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        /* تنسيقات الرسائل */
        .alert-message {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 50;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out forwards;
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        /* تحسينات للأزرار */
        .btn-primary {
            background-color: #3b82f6;
            border-color: #3b82f6;
            padding: 0.5rem 1.5rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .btn-primary:hover {
            background-color: #2563eb;
            border-color: #2563eb;
            transform: translateY(-1px);
        }
    </style>
</head>
<body>
    <div class="preview-wrapper">
        @yield('content')
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
