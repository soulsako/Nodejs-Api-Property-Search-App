//http://localhost:8000/api/v1/properties/5d80deda4b98c7218c5b1f58/reviews
import axios from 'axios';

const defaultReview = "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.";

const rating = () => {
  const array = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const randomNumber = Math.ceil(Math.random() * 10);
  const rating = array[randomNumber];
  return rating;
}

const review = () => {
  const randomNumber = Math.ceil(Math.random() * 10) * 25;
  const review = defaultReview.substring(1, randomNumber);
  return review;
}

const userIds = [
  "5d8387f997c62e1c8e6e2c1d", 
  "5d83d38b3caf1a2634b559e5", 
  "5d83d39b3caf1a2634b559e6", 
  "5d83d3a83caf1a2634b559e7", 
  "5d83d3c23caf1a2634b559e8", 
  "5d83d3d33caf1a2634b559e9", 
  "5d83d3e03caf1a2634b559ea", 
  "5d83d3f63caf1a2634b559eb", 
  "5d840d69cc4c122c694b3f6d", 
  "5d84cd49aba8532d2ceda59b"
];

const user = () => {
  const randomNumber = Math.ceil(Math.random() * 10);
  return userIds[randomNumber];
}

const propertyIDs = [

  "5d83c360ecba25230421d7a9", 
  "5d83c4c3ecba25230421d7aa", 
  "5d83c588ecba25230421d7ab", 
  "5d83c737ecba25230421d7ac",
  "5d83cb36ecba25230421d7ae", 
  "5d83cc4cecba25230421d7af", 
  "5d83cdb9ecba25230421d7b0", 
  "5d83ce48ecba25230421d7b1", 
  "5d83ce89ecba25230421d7b2", 
  "5d83cf58ecba25230421d7b3", 
  "5d83d0aeecba25230421d7b6", 
  "5d9603cc7f61c282ac831a85", 
  "5d9604857f61c282ac831a86", 
  "5d9605007f61c282ac831a87", 
  "5d96057e7f61c282ac831a88", 
  "5d96060b7f61c282ac831a89", 
  "5d96067b7f61c282ac831a8a", 
  "5d9607337f61c282ac831a8b", 
  "5d9607c17f61c282ac831a8c", 
  "5d96081e7f61c282ac831a8d", 
  "5d9608a07f61c282ac831a8e", 
  "5d9608fa7f61c282ac831a8f", 
  "5d96094c7f61c282ac831a90", 
  "5da0aee60d7c23420186ba03" 
];

const autoGenerateReviews = () => {

  propertyIDs.forEach(id => {
    axios.post(`http://localhost:8000/api/v1/properties/${id}/reviews`, {
      review: review(),
      rating: rating(),
      property: id, 
      user: user()
    });
  });
}

autoGenerateReviews();