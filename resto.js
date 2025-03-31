router.get('/view_resto', (req, res) => {
  const loggedInUser = req.session.username; // Assuming session stores the logged-in user's username
  const reviews = getReviews(); // Fetch reviews from the database
  res.render('view_resto', { reviews, loggedInUser });
});