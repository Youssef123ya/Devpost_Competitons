<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Create Hero Section</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="p-5">
  <div class="container">
    <h2>Create Hero Section</h2>
    @if(session('success'))
      <div class="alert alert-success">{{ session('success') }}</div>
    @endif

    <form action="/hero" method="POST" enctype="multipart/form-data">
      @csrf
      <div class="mb-3">
        <label>Title</label>
        <input type="text" name="title" class="form-control" required>
      </div>
      <div class="mb-3">
        <label>Subtitle</label>
        <input type="text" name="subtitle" class="form-control">
      </div>
      <div class="mb-3">
        <label>Button Text</label>
        <input type="text" name="button_text" class="form-control">
      </div>
      <div class="mb-3">
        <label>Background Image</label>
        <input type="file" name="background_image" class="form-control">
      </div>
      <button type="submit" class="btn btn-primary">Save</button>
    </form>
  </div>
</body>
</html>
