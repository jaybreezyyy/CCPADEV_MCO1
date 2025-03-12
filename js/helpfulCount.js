document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".helpful-button").forEach(button => {
      button.addEventListener("click", async function () {
        const reviewId = this.getAttribute("data-review-id");
  
        try {
          const response = await fetch(`/like_review/${reviewId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
  
          const data = await response.json();
  
          if (data.success) {
            document.getElementById(`helpful-count-${reviewId}`).textContent = data.newHelpfulCount;
          } else {
            alert("Error liking the review.");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      });
    });
  });
  