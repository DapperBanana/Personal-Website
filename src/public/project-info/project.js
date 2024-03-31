function toggleContent(container) {
    var hiddenElements = container.querySelectorAll('.popup-info');
    hiddenElements.forEach(function(element) {
        element.classList.toggle('hidden');
    });
    container.classList.toggle('active');
    container.classList.toggle('small-img');
    // Toggle height of the container
    if (container.classList.contains('active')) {
        container.style.height = "auto";
    } else {
        container.style.height = "auto";
    }
  }