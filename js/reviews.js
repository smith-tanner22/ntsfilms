const requestURL =
  'https://smith-tanner22.github.io/reviews.github.io/data/reviews.json';

fetch(requestURL)
  .then(function (response) {
    return response.json();
  })
  .then(function (jsonObject) {
    console.table(jsonObject);
    const reviews = jsonObject['reviews'];

    for (let i = 0; i < reviews.length; i++) {
      let testimonial = document.createElement('div');
      let card = document.createElement('section');
      card.classList.add('cardSection');
      let h2 = document.createElement('h2');
      h2.classList.add('cardTitle');
      let type = document.createElement('p');
      type.classList.add('cardType');
      let date = document.createElement('p');
      date.classList.add('cardDate');
      let rating = document.createElement('p');
      rating.classList.add('cardRating');
      let review = document.createElement('p');
      review.classList.add('cardReview');
      let img = document.createElement('img');
      img.classList.add('cardImg');

      h2.textContent = reviews[i].name;
      type.textContent = 'Type:' + reviews[i].type;
      date.textContent = 'Date:' + reviews[i].date;
      rating.textContent = '⭐⭐⭐⭐⭐';
      review.textContent = reviews[i].review;
      img.setAttribute('src', reviews[i].imageurl);
      img.setAttribute(
        'alt',
        reviews[i].name + ' ' + reviews[i].type + 'with ' + reviews[i].name
      );

      // testimonial.appendChild(card);
      // testimonial.appendChild(h2);
      // testimonial.appendChild(type);
      // testimonial.appendChild(date);
      // testimonial.appendChild(rating);
      // testimonial.appendChild(review);
      // testimonial.appendChild(img);
      card.appendChild(h2);
      card.appendChild(type);
      card.appendChild(date);
      card.appendChild(rating);
      card.appendChild(review);
      card.appendChild(img);

      document.querySelector('div.testimonial-box-container').appendChild(card);
    }
  });
