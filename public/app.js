// Authenticate client
$('.auth-btn').on('click', function(event) {
  event.preventDefault();
  console.log('Authenticate button clicked');
  $('.auth-result').html('');

  $.ajax({
    method: 'GET',
    url: '/user/authenticate/user-pass'
  }).done(function(result) {
    if (result === 'successful') {
      $('.auth-result')
        .html('Authentication with basic auth successful!')
        .css('color', 'green');
    } else {
      $('.auth-result')
        .html('Authentication failed')
        .css('color', 'red');
    }
  }).error(function(err) {
    handleError('Authentication', '.auth-result', 'html', err);
  });
});

// List buckets
$('.bucket-btn--list').on('click', function(event) {
  event.preventDefault();
  $('.bucket-list').html('');
  console.log('List Buckets button clicked');

  $('.buckets-list')
    .html('Retrieving buckets . . .')
    .css('color', 'orange');

  $.ajax({
    method: 'GET',
    url: '/buckets/list'
  }).done(function(buckets) {
    if (!buckets.length) {
      $('.buckets-list').html('No buckets');
    } else {
      var bucketList = document.createElement('ul');
      buckets.forEach(function(bucket) {
        $('.buckets-list')
          .html('Buckets: ')
          .css('color', 'black')
        console.log(bucket);
        //var bucketList = document.createElement('ul');
        $('.buckets-list').append($(bucketList));
        var bucketItem = document.createElement('li');
        $(bucketItem).html(`Name: ${bucket.name}, id: ${bucket.id}`);
        $(bucketList).append(bucketItem);
      });
    }
  }).error(function(err) {
    handleError('Bucket list', '.buckets-list', 'html', err);
  });
});

// Upload file
$('.files-btn--upload').on('click', function(event) {
  event.preventDefault();

  $('.files-upload').html('');
  console.log('Upload file button clicked');
  $('.files-upload')
    .html('File upload in process . . .')
    .css('color', 'orange');

  $.ajax({
    method: 'GET',
    url: '/files/upload'
  }).done(function(file) {
    console.log('upload', file)
    $('.files-upload')
      .html(`File ${file.filename} uploaded to ${file.bucket}!`)
      .css('color', 'green');
  }).error(function(err) {
    handleError('File Upload', '.files-upload', 'html', err);
  });
});

function handleError(subject, className, element, err) {
  if (err) {
    console.log(subject + ' error:', err.responseText);
    switch (err.status) {
      case 404:
        $(className)
          [element]('No endpoint! Go build it!')
          .addClass('spacer')
          .css('color', 'red');
        break;
      default:
        var showErr = err.responseText || err.statusText;
        $(className)
          [element](subject + ' error ' + err.responseText)
          .addClass('spacer')
          .css('color', 'red');
    }
  }
}
