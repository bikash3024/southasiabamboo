var element = document.querySelector(".door");
element.addEventListener("click", toggleDoor);
var element1 = document.querySelector(".door1");
element1.addEventListener("click", toggleDoor);
function toggleDoor() {

        element.classList.toggle("doorOpen");
        element1.classList.toggle("doorOpenleft");
        // setTimeout(function(){
        //     window.location.href = "https://www.ccu.edu.tw/";
        // }, 1000);      
}

// function openDoor() {

//         element1.classList.toggle("doorOpenleft");

        // setTimeout(function(){
        //     window.location.href = "https://www.ccu.edu.tw/";
        // }, 1000); 
        
// }

