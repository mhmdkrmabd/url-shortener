$(document).ready(function() {
  let shorten = $('#shorten'),
    url    = $('#url'),
    result = $('#result'),
    dialog = $('#dialog')
  url.on('keypress', function(event) {
    (event.keyCode === 13) ? shorten.click(): ""
  })
  shorten.on('click', function() {
    if (url.val().length <= 0 || url.val().trim().length <= 0) {
      url.attr('aria-invalid', 'true')
      return
    }
    url.attr('aria-invalid', 'false')
    shorten.attr('aria-busy', 'true')
    $.post('/shorten/', {
      url: url.val()
    }).done(function(shortenURL) {
      setTimeout(() => {
        url.removeAttr('aria-invalid')
        shorten.removeAttr('aria-busy')
        result.html(`<a href="${window.location.origin}/s/${shortenURL}" target="_blank">${window.location.origin}/s/${shortenURL}</a>`)
        url.focusout()
        result[0].firstChild.focus()
        dialog.attr('open', '')
      }, 1000)
    })
  })
})
