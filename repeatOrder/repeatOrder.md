## RepeatOrder Component Overview

This component comes with a repeat-order directive in the form of a button. Clicking on this button will allow you to quickly place reorders.

The directive comes in the following form:

<ordercloud-repeat-order></ordercloud-repeat-order>

Which is configurable with the following attributes:

orderid: ID of the order being reordered (required for both admin and buyer perspective)
userid: ID of the user the order is being by ( required only for admin perspective)
clientid: the client id of the app that the order is being placed by (required only for the admin perspective)
includeshipping: will include any shipping details from the previous order (optional)
includebilling: will include any billing details from the previous order (optional)
