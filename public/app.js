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
