// Site-wide meeting link. Replace with a secure booking URL when ready.
const bookingUrl = "";
const dialog=document.getElementById("booking");
if(bookingUrl){
  document.querySelectorAll(".booking").forEach(link => { link.href=bookingUrl; });
} else if(dialog){
  document.querySelectorAll(".booking").forEach(link => {
    link.addEventListener("click",event => {event.preventDefault();dialog.showModal();});
  });
}
