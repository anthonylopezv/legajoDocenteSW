
function processImage(id) {
  var options = {
      client_hints: true,
  };
  return '<img src="'+ $.cloudinary.url(id, options) +'" style="width: 100%; height: auto"/>';
}

$('#uploadphoto').click((e) => {
  e.preventDefault()
  // alert('hola')
  $.cloudinary.config({ cloud_name: 'dft8lq2m7', api_key: '511831476544168'});
  var uploadButton = $('#uploadphoto');
  cloudinary.openUploadWidget({ 
    cloud_name: 'dft8lq2m7',
    upload_preset: 'evr9esdo',
    cropping: 'server',
    tags: ['cgal']}, 
  function(error, result) { 
    if(error) console.log(error);
    var id = result[0].public_id;
    console.log(result[0].url)
    $('#photoactual').attr('src',result[0].url)
    $('#photolink').attr('value', result[0].url)
  });
})