describe('Component: Catalog', function() {
    var scope,
        q,
        oc,
        currentOrder,
        fakeproduct,
        fakeSpecList,
        modal,
        addToOrder
        ;

    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function ($q, $rootScope, OrderCloud, AddToOrder, CurrentOrder) {
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        currentOrder =CurrentOrder;
        addToOrder = AddToOrder;
        fakeproduct = {
                $$hashKey: "object:89",
                Active: true,
                AllowOrderExceedInventory: false,
                Description: "Pop",
                DisplayInventory: false,
                ID: "18",
                InventoryEnabled: false,
                InventoryNotificationPoint: null,
                Name: "Coke",
                QuantityMultiplier: 1,
                ReplenishmentPriceSchedule: null,
                ShipWeight: null,
                StandardPriceSchedule: {},
                Type: "Static",
                VariantLevelInventory: false,
                xp: {}
        };
        fakeSpecList =  [{
            "ID": "6IQM-1mmEkWFFDBpiFvb2w",
            "ListOrder": 0,
            "Name": "dadsf",
            "DefaultValue": null,
            "Required": false,
            "AllowOpenText": false,
            "DefaultOptionID": null,
            "Options": [],
            "xp": null,
            "Value": null,
            "OptionID": null
        },
        {
            "ID": "8tL_FfvwQ0e7n91WOoYsbQ",
            "ListOrder": 0,
            "Name": "dadsf",
            "DefaultValue": "1",
            "Required": false,
            "AllowOpenText": false,
            "DefaultOptionID": null,
            "Options": [],
            "xp": null,
            "Value": "1",
            "OptionID": null
        }]
    }));

    describe('State: catalog', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('catalog', {}, {reload:true});
            var orderDefer= q.defer();
            spyOn(oc.Me, 'ListCategories').and.returnValue(null);
            spyOn(currentOrder, 'Get').and.returnValue(orderDefer.promise);
        }));
        it('should resolve Catalog', inject(function ($injector) {
            $injector.invoke(state.resolve.Catalog);
            expect(oc.Me.ListCategories).toHaveBeenCalledWith(null,1);
        }));
        it('should resolve Order', inject(function ($injector) {
            $injector.invoke(state.resolve.Order,scope,{$q:q, CurrentOrder: currentOrder});
            expect(currentOrder.Get).toHaveBeenCalled();
        }));

    });

    describe('Controller: QuickViewController', function () {
        var quickViewCtrl;
        beforeEach(inject(function ($controller, $rootScope) {
            quickViewCtrl = $controller('QuickViewCtrl', {
                $scope: scope
            });
            scope = $rootScope.$new();
            var defer = q.defer();
            defer.resolve(fakeproduct);
            scope.$digest();
            spyOn(oc.Me, 'GetProduct').and.returnValue(defer.promise);
            spyOn(oc.Specs, 'ListProductAssignments').and.returnValue(defer.promise);

        }));

        it('Should call Getproduct method when modal opens', function () {
            quickViewCtrl.open(fakeproduct);
            expect(oc.Me.GetProduct).toHaveBeenCalledWith(fakeproduct.ID);
        });
        it('Should call ListProductAssignments method when modal opens', function () {
            quickViewCtrl.open(fakeproduct);
            expect(oc.Specs.ListProductAssignments).toHaveBeenCalledWith(null,fakeproduct.ID);
        });

    });


    describe('Controller: QuickViewModalController', function () {
        var quickViewModalCtrl;
        beforeEach(inject(function ($controller, $rootScope) {
            quickViewModalCtrl = $controller('QuickViewModalCtrl', {
                $scope: scope,
                $uibModalInstance: modal,
                SelectedProduct: fakeproduct,
                SpecList: fakeSpecList
            });
            scope = $rootScope.$new();
            var defer = q.defer();
            defer.resolve(fakeproduct);
            scope.$digest();
            spyOn(addToOrder, 'Add').and.returnValue(defer.promise);
            quickViewModalCtrl.selectedProduct = fakeproduct;
            $uibModalInstance = jasmine.createSpyObj('$uibModalInstance', ['close', 'dismiss']);
        }));

        it('Should call Add method and pass product object', function () {
            quickViewModalCtrl.addToCart(fakeproduct);
            expect(addToOrder.Add).toHaveBeenCalledWith(fakeproduct);
        });
    });

});


