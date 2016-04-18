angular.module('orderCloud')
    .config(ExpressCheckoutConfig)
    .controller('ExpressCheckoutCtrl', ExpressCheckoutController)
    .directive('ordercloudUserDefaults', ExpressCheckoutUserDefaultsDirective)
    .controller('ExpressCheckoutUserDefaultsCtrl', ExpressCheckoutUserDefaultsController)

;

function ExpressCheckoutConfig($stateProvider) {
    $stateProvider
        .state('expressCheckout', {
            parent: 'base',
            url: '/expressCheckout',
            templateUrl: 'expressCheckout/templates/expressCheckout.tpl.html',
            controller: 'ExpressCheckoutCtrl',
            controllerAs: 'expressCheckout',
            resolve: {
                CurrentUser: function(OrderCloud) {
                    return OrderCloud.Me.Get();
                },
                Order: function($rootScope, $q, $state, toastr, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function(order) {
                            dfd.resolve(order)
                        })
                        .catch(function() {
                            toastr.error('You do not have an active open order.', 'Error');
                            if ($state.current.name.indexOf('checkout') > -1) {
                                $state.go('home');
                            }
                            dfd.reject();
                        });
                    return dfd.promise;
                },
                OrderPayments: function($q, OrderCloud, Order) {
                    var deferred = $q.defer();
                    OrderCloud.Payments.List(Order.ID)
                        .then(function(data) {
                            if (!data.Items.length) {
                                OrderCloud.Payments.Create(Order.ID, {})
                                    .then(function(p) {
                                        deferred.resolve({Items: [p]});
                                    })
                            }
                            else {
                                deferred.resolve(data);
                            }
                        });
                    return deferred.promise;
                },
                CreditCards: function(OrderCloud) {
                    return OrderCloud.Me.ListCreditCards();
                },
                SpendingAccounts: function(OrderCloud) {
                    return OrderCloud.SpendingAccounts.List(null, null, null, null, null, {'RedemptionCode': '!*'});
                },
                ShippingAddresses: function($q, Underscore, OrderCloud) {
                    var dfd = $q.defer();
                    OrderCloud.Me.ListAddresses()
                        .then(function(data) {
                            dfd.resolve(Underscore.where(data.Items, {Shipping:true}));
                        });
                    return dfd.promise;
                },
                BillingAddresses: function($q, Underscore, OrderCloud) {
                    var dfd = $q.defer();
                    OrderCloud.Me.ListAddresses()
                        .then(function(data) {
                            dfd.resolve(Underscore.where(data.Items, {Biling:true}));
                        });
                    return dfd.promise;
                },
                DefaultCreditCard: function($q, CurrentUser, OrderPayments, Order, OrderCloud) {
                    var dfd = $q.defer();
                    if(OrderPayments.Items[0] && OrderPayments.Items[0].Type === 0 && CurrentUser.xp && CurrentUser.xp.defaultCreditCardID) {
                        OrderCloud.Payments.Update(Order.ID, OrderPayments.Items[0].ID, {Type: 'CreditCard', CreditCardID: CurrentUser.xp.defaultCreditCardID})
                            .then(function() {
                                dfd.resolve(Order);
                            });
                    }
                    else {
                        dfd.resolve(Order);
                    }
                    return dfd.promise;
                },
                DefaultShipping: function($q, CurrentUser, Order, OrderCloud) {
                    var dfd = $q.defer();
                    if(!Order.ShippingAddressID && CurrentUser.xp && CurrentUser.xp.defaultShippingAddressID) {
                        OrderCloud.Orders.Patch(Order.ID, {ShippingAddressID: CurrentUser.xp.defaultShippingAddressID})
                            .then(function() {
                                dfd.resolve(Order);
                            });
                    }
                    else {
                        dfd.resolve(Order);
                    }
                    return dfd.promise;
                },
                DefaultBilling: function($q, CurrentUser, Order, OrderCloud) {
                    var dfd = $q.defer();
                    if(!Order.BillingAddressID && CurrentUser.xp && CurrentUser.xp.defaultBillingAddressID) {
                        OrderCloud.Orders.Patch(Order.ID, {BillingAddressID: CurrentUser.xp.defaultBillingAddressID})
                            .then(function() {
                                dfd.resolve(Order);
                            });
                    }
                    else {
                        dfd.resolve(Order);
                    }
                    return dfd.promise;
                }

            }
    })
}

function ExpressCheckoutController($state, toastr, OrderCloud, CurrentUser, CurrentOrder, Order, OrderPayments, CreditCards, SpendingAccounts, ShippingAddresses, BillingAddresses, DefaultCreditCard, DefaultShipping, DefaultBilling) {
    var vm = this;
    vm.creditCards = CreditCards;
    vm.spendingAccounts = SpendingAccounts;
    vm.shippingAddresses = ShippingAddresses;
    vm.billingAddresses = BillingAddresses;
    vm.currentOrder = Order;
    vm.orderPayments = OrderPayments.Items;
    vm.currentUser = CurrentUser;
    vm.defaultCreditCard = DefaultCreditCard;
    vm.defaultShipping = DefaultShipping;
    vm.defaultBilling = DefaultBilling;
    vm.paymentMethods = [
        {Display: 'Purchase Order', Value: 'PurchaseOrder'},
        {Display: 'Credit Card', Value: 'CreditCard'},
        {Display: 'Spending Account', Value: 'SpendingAccount'}
    ];

    OrderCloud.LineItems.List(vm.currentOrder.ID)
        .then(function(data){
           vm.currentOrder.lineItems = data.Items;
        });

    vm.saveBillAddress = function() {
        OrderCloud.Orders.Patch(vm.currentOrder.ID, {BillingAddressID: vm.currentOrder.BillingAddressID})
            .then(function(){
               $state.reload();
            });
    };

    vm.saveShipAddress = function() {
        OrderCloud.Orders.Patch(vm.currentOrder.ID, {ShippingAddressID: vm.currentOrder.ShippingAddressID})
            .then(function(){
                $state.reload();
            });
    };

    function checkPaymentType() {
        if(vm.orderPayments[0].Type == 'CreditCard' && vm.orderPayments[0].CreditCardID) {
            OrderCloud.CreditCards.Get(vm.orderPayments[0].CreditCardID)
                .then(function(cc){
                    vm.creditCardDetails = cc;
                })
        }
        if(vm.orderPayments[0].Type == 'SpendingAccount' && vm.orderPayments[0].SpendingAccountID) {
            OrderCloud.SpendingAccounts.Get(vm.orderPayments[0].SpendingAccountID)
                .then(function(sa){
                    vm.spendingAccountDetails = sa;
                })
        }
    };

    checkPaymentType();

    vm.setPaymentMethod = function(order) {
        if (!vm.orderPayments.length) {
            // When Order Payment Method is changed it will clear out all saved payment information
            OrderCloud.Payments.Create(order.ID, {Type: vm.orderPayments[0].Type})
                .then(function() {
                    $state.reload();
                });
        }
        else {
            OrderCloud.Payments.Delete(order.ID, vm.orderPayments[0].ID)
                .then(function(){
                    OrderCloud.Payments.Create(order.ID, {Type: vm.orderPayments[0].Type})
                        .then(function() {
                            $state.reload();
                        });
                })
        }
    };

    vm.setCreditCard = function(order) {
        if (vm.orderPayments[0].Type === "CreditCard") {
            OrderCloud.Payments.Patch(order.ID, vm.orderPayments[0].ID, {CreditCardID: vm.orderPayments[0].CreditCardID})
                .then(function() {
                    $state.reload();
                });
        }
    };

    vm.setSpendingAccount = function(order) {
        if (vm.orderPayments[0].Type ==='SpendingAccount') {
            OrderCloud.Payments.Patch(order.ID, vm.orderPayments[0].ID, {SpendingAccountID: vm.orderPayments[0].SpendingAccountID})
                .then(function() {
                    $state.reload();
                })
                .catch(function(err) {
                    OrderCloud.Payments.Patch(order.ID, vm.orderPayments[0].ID, {SpendingAccountID: null})
                        .then(function() {
                            $state.reload();
                            toastr.error(err.data.Errors[0].Message + ' Please choose another payment method, or another spending account.', 'Error:')
                        })
                });
        }
    };

    vm.submitOrder = function() {
        OrderCloud.Orders.Submit(vm.currentOrder.ID)
            .then(function() {
                CurrentOrder.Remove()
                    .then(function(){
                        toastr.success('Your order has been submitted', 'Success');
                        $state.go('orderReview', {orderid: vm.currentOrder.ID})
                    })
            })
            .catch(function() {
                toastr.error("Your order did not submit successfully.", 'Error');
            });
    }

}

function ExpressCheckoutUserDefaultsDirective() {
    return {
        templateUrl: 'expressCheckout/templates/expressCheckoutUserDefaults.tpl.html',
        controller: 'ExpressCheckoutUserDefaultsCtrl',
        controllerAs: 'expressCheckoutUserDefaults'
    };
}

function ExpressCheckoutUserDefaultsController(Underscore, OrderCloud) {
    var vm = this;

    OrderCloud.Me.Get()
        .then(function(data){
            vm.me = data;
        });

    OrderCloud.Me.ListCreditCards()
        .then(function(data){
            vm.creditCards = data;
        });

    OrderCloud.Me.ListAddresses()
        .then(function(data){
            vm.shippingAddresses = Underscore.where(data.Items, {Shipping: true});
            vm.billingAddresses = Underscore.where(data.Items, {Biling: true});
        });

    vm.updateDefault = function() {
        OrderCloud.Me.Update(vm.me)
    };
}