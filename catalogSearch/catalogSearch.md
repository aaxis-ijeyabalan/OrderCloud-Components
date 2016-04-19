## catalogSearch Component Overview

This component includes a Catalog search box with type-ahead functionality.

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



