standardSearch.md

## standardSearch Component Overview

This component includes a Product/Category search box with type-ahead functionality.

The search box directive can be placed anywhere in your HTML by including the following:
```javascript
<ordercloud-standardSearch></ordercloud-standardSearch>
```

maxprod and maxcat are additional attributes that can be added to the directive that allow you
to specify the maximum number of items you would like listed in the typeahead for both Products
and Categories respectively.

For example the following line of code will allow up to 8 items for Products and Categories:

```javascript
<ordercloud-standardSearch maxprod=8 maxcat=8></ordercloud-standardSearch>
```

If these attributes are not included it will default to 5 for each.


This component also includes a quickview button directive, which when clicked pops up a modal of the product and allows you to order that item in the modal.
```javascript
<ordercloud-quickview product=""></ordercloud-quickview>
```

It is designed to be interpolated or inserted into the ng-repeat directive, where the array should be a list of products.
The product attribute is required. Here is where you pass the product object into the modal which then allows you to add that specific product into your shopping cart.

For example the following line of code will take the id
```javascript
<div class="col-md-3 " ng-repeat="aproduct in results.products.list.Items">
<ordercloud-quickview product="aproduct"></ordercloud-quickview>. 
```
