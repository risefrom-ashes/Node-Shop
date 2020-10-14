const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector('[name=productId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  const productElement = btn.closest('article');

  fetch('/admin/delete/' + productId, {
      method: 'DELETE',
      headers: {
        'csrf-token': csrf
      }
    })
    .then((result) => {
      console.log(result);
      productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
      console.log(err);
    })
}


var stripe = Stripe('pk_test_51GqctYJKUftLYT2rLKnGNLrfcDu6kYKdC0OO7ekTJaRGDOX9C3a7uFL4XtogH7F4po4wnvQDIaU5HCeVwXyC1BmL00RT8Fa3DV');
var elements = stripe.elements();

var style = {
  base: {
    color: "#32325d",
  }
};

var card = elements.create("card", { style: style });
card.mount("#card-element");