document.addEventListener("DOMContentLoaded", function() {
    // Example JavaScript code to show an alert when a button is clicked
    const button = document.createElement('button');
    button.textContent = 'Click Me!';
    document.body.appendChild(button);

    button.addEventListener('click', function() {
        alert('Welcome to GearheadResources!');
    });
});
