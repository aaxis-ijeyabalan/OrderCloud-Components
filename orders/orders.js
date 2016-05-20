angular.module( 'orderCloud' )

    .config( OrdersConfig )
    .controller( 'OrdersCtrl', OrdersController )
    .controller( 'OrderEditCtrl', OrderEditController )
    .factory( 'OrdersTypeAheadSearchFactory', OrdersTypeAheadSearchFactory )
;

function OrdersConfig( $stateProvider ) {
    $stateProvider
        .state( 'orders', {
            parent: 'base',
            url: '/orders?from&to&search&page&pageSize&searchOn&sortBy&filters',
            templateUrl:'orders/templates/orders.tpl.html',
            controller:'OrdersCtrl',
            controllerAs: 'orders',
            data: {componentName: 'Orders'},
            resolve: {
                OrderList: function(OrderCloud, $stateParams) {
                    var filterObj = null;
                    if ($stateParams.filters) {
                        filterObj = JSON.parse($stateParams.filters);
                    }
                    return OrderCloud.Orders.ListIncoming(null, null, $stateParams.search, $stateParams.page, $stateParams.pageSize || 12, $stateParams.searchOn, $stateParams.sortBy, filterObj);
                }
            }
        })
        .state( 'orders.edit', {
            url: '/:orderid/edit',
            templateUrl:'orders/templates/orderEdit.tpl.html',
            controller:'OrderEditCtrl',
            controllerAs: 'orderEdit',
            resolve: {
                SelectedOrder: function($stateParams, OrderCloud) {
                    return OrderCloud.Orders.Get($stateParams.orderid);
                },
                SelectedPayments: function($stateParams, $q, OrderCloud){
                    var dfd = $q.defer();
                    var paymentList = {};

                    OrderCloud.Payments.List($stateParams.orderid, null, 1, 100)
                        .then(function(data) {
                            paymentList = data.Items;
                            dfd.resolve(paymentList);
                            angular.forEach(paymentList, function(payment){
                                if(payment.Type === 'CreditCard'){
                                    OrderCloud.CreditCards.Get(payment.CreditCardID)
                                        .then(function(cc){
                                            payment.creditCards = cc;
                                        })
                                }
                            });
                            dfd.resolve(paymentList);
                        });
                    return dfd.promise;

                },
                LineItemList: function($stateParams, OrderCloud) {
                    return OrderCloud.LineItems.List($stateParams.orderid);
                }
            }
        })
    ;
}

function OrdersController($state, $stateParams, Underscore, OrderList, OrderCloud) {
    var vm = this;
    vm.list = OrderList;

    //console.log($stateParams);
    //var explicitParams = ['from', 'to', 'search', 'page', 'pageSize', 'searchOn', 'sortBy'];
    //var filters = Underscore.omit($stateParams, explicitParams);
    vm.applyFilters = function() {
        var filterObj = {
            CouponCost:0
        };
        var filterString = JSON.stringify(filterObj);
        console.log(filterString);
        $state.go('.', {filters:filterString});
    };

    vm.pageChanged = function() {
        $state.go('.', {search:$stateParams.search, page:vm.list.Meta.Page, pageSize:$stateParams.pageSize});
    };

    vm.pageFunction = function() {
        return OrderCloud.Orders.ListIncoming($stateParams.from, $stateParams.to, $stateParams.search, vm.list.Meta.Page + 1, $stateParams.pageSize || vm.list.Meta.PageSize)
            .then(function(data) {
                console.log(data.Items);
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    }
}

function OrderEditController( $scope, $q, $exceptionHandler, $state, OrderCloud, SelectedOrder, SelectedPayments, OrdersTypeAheadSearchFactory, LineItemList, toastr) {
    var vm = this,
    orderid = SelectedOrder.ID;
    vm.order = SelectedOrder;
    vm.orderID = SelectedOrder.ID;
    vm.list = LineItemList;
    vm.paymentList = SelectedPayments;

    vm.pagingfunction = PagingFunction;
    $scope.isCollapsedPayment = true;
    $scope.isCollapsedBilling = true;
    $scope.isCollapsedShipping = true;

    vm.deletePayment = function(payment){
        OrderCloud.Payments.Delete(orderid, payment.ID)
            .then(function(){
                $state.go($state.current, {}, {reload:true});
            })
            .catch(function(ex){
                $exceptionHandler(ex)
            });
    };

    vm.deleteLineItem = function(lineitem) {
        OrderCloud.LineItems.Delete(orderid, lineitem.ID)
            .then(function() {
                $state.go($state.current, {}, {reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.updateBillingAddress = function(){
        vm.order.BillingAddressID = null;
        vm.order.BillingAddress.ID = null;
        OrderCloud.Orders.Update(orderid, vm.order)
            .then(function(){
                OrderCloud.Orders.SetBillingAddress(orderid, vm.order.BillingAddress)
                .then(function() {
                    $state.go($state.current, {}, {reload: true});
                });
        })
    };

    vm.updateShippingAddress = function(){
        OrderCloud.Orders.SetShippingAddress(orderid, vm.ShippingAddress);
            //.then(function() {
            //    $state.go($state.current, {}, {reload: true});
            //});
    };

    vm.Submit = function() {
        var dfd = $q.defer();
        var queue = [];
        angular.forEach(vm.list.Items, function(lineitem, index) {
            if ($scope.EditForm.PaymentInfo.LineItems['Quantity' + index].$dirty || $scope.EditForm.PaymentInfo.LineItems['UnitPrice' + index].$dirty ) {
                queue.push(OrderCloud.LineItems.Update(orderid, lineitem.ID, lineitem));
            }
        });
        $q.all(queue)
            .then(function() {
                dfd.resolve();
                OrderCloud.Orders.Update(orderid, vm.order)
                    .then(function() {
                        toastr.success('Order Updated', 'Success');
                        $state.go('orders', {}, {reload:true});
                    })
                    .catch(function(ex) {
                        $exceptionHandler(ex)
                    });
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });

        return dfd.promise;
    };

    vm.Delete = function() {
        OrderCloud.Orders.Delete(orderid)
            .then(function() {
                $state.go('orders', {}, {reload:true});
                toastr.success('Order Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.PageSize) {
            OrderCloud.LineItems.List(vm.order.ID, vm.list.Meta.Page + 1, vm.list.Meta.PageSize).then(
                function(data) {
                    vm.list.Meta = data.Meta;
                    vm.list.Items = [].concat(vm.list.Items, data.Items);
                }
            )
        }
    }
    vm.spendingAccountTypeAhead = OrdersTypeAheadSearchFactory.SpendingAccountList;
    vm.shippingAddressTypeAhead = OrdersTypeAheadSearchFactory.ShippingAddressList;
    vm.billingAddressTypeAhead = OrdersTypeAheadSearchFactory.BillingAddressList;
}

function OrdersTypeAheadSearchFactory($q, OrderCloud, Underscore) {
    return {
        SpendingAccountList: SpendingAccountList,
        ShippingAddressList: ShippingAddressList,
        BillingAddressList: BillingAddressList
    };

    function SpendingAccountList(term) {
        return OrderCloud.SpendingAccounts.List(term).then(function(data) {
            return data.Items;
        });
    }

    function ShippingAddressList(term) {
        var dfd = $q.defer();
        var queue = [];
        queue.push(OrderCloud.Addresses.List(term));
        queue.push(OrderCloud.Addresses.ListAssignments(null, null, null, null, true));
        $q.all(queue)
            .then(function(result) {
                var searchAssigned = Underscore.intersection(Underscore.pluck(result[0].Items, 'ID'), Underscore.pluck(result[1].Items, 'AddressID'));
                var addressList = Underscore.filter(result[0].Items, function(address) {
                    if (searchAssigned.indexOf(address.ID) > -1) {
                        return address;
                    }
                });
                dfd.resolve(addressList);
            });
        return dfd.promise;
    }

    function BillingAddressList(term) {
        var dfd = $q.defer();
        var queue = [];
        queue.push(OrderCloud.Addresses.List(term));
        queue.push(OrderCloud.Addresses.ListAssignments(null, null, null, null, null, true));
        $q.all(queue)
            .then(function(result) {
                var searchAssigned = Underscore.intersection(Underscore.pluck(result[0].Items, 'ID'), Underscore.pluck(result[1].Items, 'AddressID'));
                var addressList = Underscore.filter(result[0].Items, function(address) {
                    if (searchAssigned.indexOf(address.ID) > -1) {
                        return address;
                    }
                });
                dfd.resolve(addressList);
            });
        return dfd.promise;
    }
}