angular.module('orderCloud')
    .config(ExpressCheckoutConfig)
    .controller('ExpressCheckoutOrderConfirmationCtrl', ExpressCheckoutOrderConfirmationController)
    .directive('ordercloudUserDefaults', ExpressCheckoutUserDefaultsDirective)
    .controller('ExpressCheckoutUserDefaultsCtrl', ExpressCheckoutUserDefaultsController)

;

function ExpressCheckoutConfig($stateProvider) {
    $stateProvider
        .state('expressCheckout.confirmation', {
            parent: 'base',
            url: '/expressCheckout/confirmation',
            templateUrl: 'expressCheckout/templates/expressCheckoutConfirmation.tpl.html',
            controller: 'ExpressCheckoutOrderConfirmationCtrl',
            controllerAs: 'expressCheckoutOrderConfirmation',
            resolve: {
                CreditCards: function(OrderCloud) {
                    return OrderCloud.Me.ListCreditCards();
                },
                ShippingAddresses: function(Underscore, OrderCloud) {
                    OrderCloud.Me.ListAddresses()
                        .then(function(data) {
                           return Underscore.where(data.Items, {isShipping: true});
                        });
                },
                BillingAddresses: function(Underscore, OrderCloud) {
                    OrderCloud.Me.ListAddresses()
                        .then(function(data) {
                            return Underscore.where(data.Items, {isBilling: true});
                        });
                }
            }
    })
}

function ExpressCheckoutOrderConfirmationController(CreditCards, ShippingAddresses, BillingAddresses) {
    var vm = this;
    vm.creditCards = CreditCards;
    vm.shippingAddresses = ShippingAddresses;
    vm.billingAddresses = BillingAddresses;

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