var element = document.querySelector(".door");
cnt=0;
element.addEventListener("click", toggleDoor);

function toggleDoor() {

        element.classList.toggle("doorOpen");
        setTimeout(function(){
                $('.human').css('display','none');
        }, 500);
        setTimeout(function(){
                
                window.location.href = "index.html";
        }, 1000); 
        
}