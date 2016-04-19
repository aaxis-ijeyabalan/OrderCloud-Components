## Catalog Component Overview

This component allows buyer users to view categories, sub-categories, and products assigned to them.

It uses the Me resource to list the correct data for the logged in user.

If you have configured Category and Product Facets using the Facets component, the catalog component will take care of displaying those facets to the buyer user while browsing the catalog.

Catalog is a buyer perspective component, and can only be accessed when logged in as a buyer user, or when impersonating a buyer user.



----
#### Product Quick View Directive

This component  includes a quickview button directive, when this button is clicked a modal will appear and will display the product and also allows you to order that product in the modal.
```javascript
<ordercloud-quickview product=""></ordercloud-quickview>
```

It is designed to be interpolated or inserted into the ng-repeat directive, where the array should be a list of products.
The product attribute is required. Here is where you pass the product object into the modal which then allows you to add that specific product into your shopping cart.
<!--Indicate that quick view modal allows you to choose or set spec values on product if applicable. Also close out div in example , take out directive after ng repeart say this is an example-->

```javascript
<div class="col-md-3 " ng-repeat="aproduct in results.products.list.Items">
    <h3 class="item-name">{{aproduct.Name || aproduct.ID}}</h3>
    <ordercloud-quickview product="aproduct"></ordercloud-quickview>. 
</div>
```