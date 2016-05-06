fdescribe('Component: Cart', function() {
    var scope,
        q,
        oc,
        currentOrder,
        lineItemHelpers,
        lineItemsList
        ;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function ($rootScope, $q, OrderCloud, CurrentOrder, LineItemHelpers) {
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        currentOrder = CurrentOrder;
        lineItemHelpers = LineItemHelpers;
        fakeOrder = {
            ID: "TestOrder123456789",
            Type: "Standard",
            FromUserID: "TestUser123456789",
            BillingAddressID: "TestAddress123456789",
            ShippingAddressID: "TestAddress123456789",
            SpendingAccountID: null,
            Comments: null,
            PaymentMethod: null,
            CreditCardID: null,
            ShippingCost: null,
            TaxCost: null
        };
         lineItemsList = {
            "Items" : [{},{}],
            "Meta" : {
                "Page": 1,
                "PageSize": 20,
                "TotalCount":29,
                "TotalPages": 2,
                "ItemRange" : [1,2]
             }
        };

    }));

    describe('State: cart', function() {
        var state;
        var noOrder;
        var lineItemData={Items:[{},{}]};
        beforeEach(inject(function($state) {
            state = $state.get('cart');
            var defer = q.defer();
            defer.resolve(lineItemData);
            spyOn(currentOrder, 'Get').and.returnValue(defer.promise);
            spyOn($state, 'go');
            spyOn(oc.LineItems,'List').and.returnValue(defer.promise);
            spyOn(lineItemHelpers,'GetProductInfo').and.returnValue(defer.promise);

        }));
        it('should resolve Order', inject(function($injector) {
            $injector.invoke(state.resolve.Order, scope,{ CurrentOrder: currentOrder});
            expect(currentOrder.Get).toHaveBeenCalled();
        }));
        it('should resolve CurrentOrderResolve when Order is not defined', inject(function($injector, $state) {
            $injector.invoke(state.resolve.CurrentOrderResolve,scope,{ Order:noOrder});
            expect($state.go).toHaveBeenCalled();
        }));
        it('should resolve LineItemList when line Items are available', inject(function($injector) {
            $injector.invoke(state.resolve.LineItemsList, scope,{ Order: fakeOrder});
            expect(oc.LineItems.List).toHaveBeenCalledWith(fakeOrder.ID);
            scope.$digest();
            expect(lineItemHelpers.GetProductInfo).toHaveBeenCalledWith(lineItemData.Items);
        }));
    });

    describe('Controller : CartController',function(){
        var cartController;
        beforeEach(inject(function ($state, $controller) {
            cartController = $controller('CartCtrl', {
                $scope: scope,
                Order: fakeOrder,
                LineItemsList: lineItemsList,
                LineItemHelpers: lineItemHelpers
            });
            var defer = q.defer();
            defer.resolve(lineItemsList);
            spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
            spyOn(lineItemHelpers,'GetProductInfo').and.returnValue(defer.promise);
            spyOn(oc.Orders,'Get').and.returnValue(defer.promise);
        }));

        describe('PagingFunction',function(){
         it('should call LineItems List Method', function(){
             cartController.pagingfunction();
             expect(oc.LineItems.List).toHaveBeenCalledWith(fakeOrder.ID,lineItemsList.Meta.Page + 1,lineItemsList.Meta.PageSize);
             scope.$digest();
             expect(lineItemHelpers.GetProductInfo).toHaveBeenCalledWith(lineItemsList.Items);
         });
        });
        describe('OC:UpdateOrder',function(){
            it('should call Orders Get Method', inject(function($rootScope){
                $rootScope.$broadcast('OC:UpdateOrder' ,fakeOrder.ID);
                scope.$digest();
                expect(oc.Orders.Get).toHaveBeenCalledWith(fakeOrder.ID);
            }))
        });
    });

    describe('Controller: MiniCartController',function(){
        var miniCartController;

        beforeEach(inject(function ($state,$controller){
            miniCartController = $controller('MiniCartCtrl',{
                $scope: scope,
                CurrentOrder: currentOrder,
                LineItemHelpers: lineItemHelpers
            });
            var defer= q.defer();
            defer.resolve();
            spyOn($state,'get').and.returnValue(defer.promise);
            spyOn($state,'go').and.returnValue(null);
            //spyOn(currentOrder,'Get').and.returnValue();

            var orderdfd= q.defer();
            orderdfd.resolve(fakeOrder.ID);
            spyOn(oc.LineItems,'List').and.returnValue(orderdfd.promise)


        }));

        //this test is mocking the functionality of the call, would there be a better way to test this?
        //it('should call Get Method on CurrentOrder',function(){
        //    currentOrder.Get();
        //    expect(currentOrder.Get).toHaveBeenCalled();
        //});

        describe('CheckForExpress',function(){
            var expressCheckout = false;
            //var state ={'url' : '/expressCheckout'};
            it('should change expressCheckout to true when in the corresponding state',inject(function($state){
                var state ={'url' : '/expressCheckout'};

                miniCartController.checkForExpress();
                //angular.forEach(state);
                expect($state.get).toHaveBeenCalled();
                expect(expressCheckout).toEqual(true);
            }));
        });

        describe('checkForCheckout',function(){

        });

        describe('goToCart',function(){
            it('should call $state.go',inject(function($state){
                miniCartController.goToCart();
                expect($state.go).toHaveBeenCalled();
            }));
        });
        //
        //describe('getLineItems',function(){
        //    it('should call LineItems List method',function(){
        //        expect(oc.LineItems.List).toHaveBeenCalledWith(fakeOrder.ID);
        //    });

        //});


    });

});