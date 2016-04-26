describe('Component: Catalog Search', function(){
    var scope,
        q,
        oc,
        searchTerm,
        product,
        category;

    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q,$rootScope,OrderCloud){
        q = $q;
        scope = $rootScope.$new();
        oc = OrderCloud;
        searchTerm = 'burger';
        category = {
            Meta: 'fakemetadata',
            Items: [{
                ID: "TestCategory123456789",
                Name: "TestCategoryTest",
                Description: "Test Category Description",
                ListOrder: 1,
                Active: true
            }]
        };
        product = {
            Meta: 'fakemetadata',
            Items: [{
                ID: "TestProduct123456789",
                Name: "TestProductTest",
                Description: "Test Product Description",
                QuantityMultiplier: 1,
                ShipWeight: 1,
                Active: true,
                Type: "Static",
                InventoryEnabled: false,
                InventoryNotificationPoint: null,
                VariantLevelInventory: false,
                AllowOrderExceedInventory: false,
                DisplayInventory: false
            }]
        };
    }));

    describe('State: catalogSearchResults', function(){
        var state;
        beforeEach(inject(function($state){
            state = $state.get('catalogSearchResults', {}, {reload:true});
            spyOn(oc.Me, 'ListCategories').and.returnValue(null);
            spyOn(oc.Me, 'ListProducts').and.returnValue(null);
        }));
        it('should resolve CategoryList', inject(function($injector) {
            $injector.invoke(state.resolve.CategoryList);
            expect(oc.Me.ListCategories).toHaveBeenCalled();
        }));
        it('should resolve ProductList', inject(function($injector) {
            $injector.invoke(state.resolve.ProductList);
            expect(oc.Me.ListProducts).toHaveBeenCalled();
        }))
    });

    describe('Controller: CatalogSearchController', function(){
        var catalogSearchCtrl;
        beforeEach(inject(function($state,$controller) {
            catalogSearchCtrl = $controller('CatalogSearchCtrl', {
                $scope: scope
            });
            spyOn($state, 'go');
        }));

        describe('popUpResults', function(){
            beforeEach(function(){
                term = searchTerm;
                catalogSearchCtrl.productData = product;
                catalogSearchCtrl.categoryData = category;
                spyOn(oc.Me, 'ListProducts').and.callFake(function(){
                    var defer = q.defer();
                    defer.resolve(product);
                    return defer.promise;
                });
                spyOn(oc.Me, 'ListCategories').and.callFake(function(){
                    var defer = q.defer();
                    defer.resolve(category);
                    return defer.promise;
                });
                catalogSearchCtrl.popupResults(term);
            });

            afterEach(function(){
                scope.$digest();
            });
            it('should call the Me.ListProducts method', function(){
                expect(oc.Me.ListProducts).toHaveBeenCalledWith(searchTerm, null, 1, 5)
            });
            it('should call the Me.ListCategories method', function(){
                expect(oc.Me.ListCategories).toHaveBeenCalledWith(searchTerm, 'all', 1, 5)
            });
        });
        describe('onSelect', function(){
            categoryItem = {attribute1:'fakedata', NameType:'Category', ID: 1};
            productItem = {attribute1:'fakedata', NameType:'Product', ID: 2};
            it('should go to catalog.category state if $item.NameType is "Category"',inject(function($state){
                catalogSearchCtrl.onSelect(categoryItem);
                expect($state.go).toHaveBeenCalledWith('catalog.category', {categoryid:1});
            }));
            it('should go to catalog.product state if $item.NameType is "Product"', inject(function($state){
                catalogSearchCtrl.onSelect(productItem);
                expect($state.go).toHaveBeenCalledWith('catalog.product', {productid:2})
            }));
        });
        describe('onHardEnter', function(){
            it('should go to CatalogSearchResults page with search term as parameter', inject(function($state){
                catalogSearchCtrl.onHardEnter(searchTerm);
                expect($state.go).toHaveBeenCalledWith('catalogSearchResults', {searchterm: searchTerm}, {reload:true})
            }))
        });
    })
});