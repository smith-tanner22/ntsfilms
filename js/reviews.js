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
      let card = document.createElement('section');
      let h2 = document.createElement('h2');
      let type = document.createElement('p');
      let date = document.createElement('p');
      let rating = document.createElement('p');
      let review = document.createElement('p');
      let img = document.createElement('img');

      h2.textContent = reviews[i].name;
      type.textContent = 'Type:' + reviews[i].type;
      date.textContent = 'Date:' + reviews[i].date;
      rating.textContent = reviews[i].rating + ' stars';
      review.textContent = reviews[i].review;
      img.setAttribute('src', reviews[i].imageurl);
      img.setAttribute(
        'alt',
        reviews[i].name + ' ' + reviews[i].type + 'with ' + reviews[i].name
      );

      card.appendChild(h2);
      card.appendChild(type);
      card.appendChild(date);
      card.appendChild(rating);
      card.appendChild(review);
      card.appendChild(img);

      document.querySelector('div.cards').appendChild(card);
    }
  });
