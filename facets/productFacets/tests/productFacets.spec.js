describe('Component: Product Facets', function() {
    var scope,
        q,
        assignedCategory,
        categoryList,
        product,
        oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        categoryList = {
            Meta: {},
            Items: [
                {
                    ID: "TestCategory123456789",
                    Name: "TestCategoryTest",
                    Description: "Test Category Description",
                    ListOrder: 1,
                    Active: true,
                    xp: {
                        OC_Facets: {
                            size: {
                                Values: ['s', 'm', 'l'],
                                isRequired: true
                            },
                            color: {
                                Values: ['red', 'green', 'blue'],
                                isRequired: false
                            }
                        }
                    }
                }
            ]
        };
        assignedCategory =
            {
                ID: "TestCategory123456789",
                Name: "TestCategoryTest",
                Description: "Test Category Description",
                ListOrder: 1,
                Active: true,
                xp: {
                    OC_Facets: {
                        size: {
                            Values: ['s', 'm', 'l'],
                            isRequired: true
                        },
                        color: {
                            Values: ['red', 'green', 'blue'],
                            isRequired: false
                        }
                    }
                }
            };
        product = {
            ID: 'TestProd123456789',
            xp: {
                OC_Facets: {
                    TestCategory123456789: {
                        color: ['blue'],
                        size: []
                    }
                }
            }
        };
        oc = OrderCloud;
    }));
    describe('State: productFacets', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('productFacets')
            spyOn(oc.Products, 'List').and.returnValue(null);
        }));
        it('should resolve ProductList', inject(function($injector){
            $injector.invoke(state.resolve.ProductList);
            expect(oc.Products.List).toHaveBeenCalled();
        }));
    });
    describe('State: productFacets.manage', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('productFacets.manage');
            spyOn(oc.Products, 'Get').and.returnValue(null);
            var dfd = q.defer();
            dfd.resolve(categoryList);
            spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(dfd.promise);
        }));
        it('should resolve Product', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.Product);
            expect(oc.Products.Get).toHaveBeenCalledWith($stateParams.productid);
        }));
        it('should resolve AssignedCategories', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.AssignedCategories);
            expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith(null, $stateParams.productid);
        }));
    });
    describe('Controller: FacetedProductManageController', function() {
        var facetedProductManageCtrl;
        var facetName = 'color';
        beforeEach(inject(function($controller){
            facetedProductManageCtrl = $controller('ProductFacetsManageCtrl', {
                $scope: scope,
                Product: product,
                AssignedCategories: assignedCategory
            });
            facetedProductManageCtrl.newFacetValue = 'purple';

        }));
        //TODO: figure out how to use the isolated scope here to get tests to run
        xdescribe('setSelected', function(){
           beforeEach(function(){
               facetedProductManageCtrl.setSelected(scope);
           });
            it('should',function(){
               expect(scope.selected).toEqual(product.xp.OC_Facets.TestCategory123456789.color[0]);
            });
        });
        xdescribe('toggleSelection', function(){
            beforeEach(function(){
                facetedProductManageCtrl.toggleSelection(scope);
            });
            it('should',function(){
                expect(scope.selected).toEqual(product.xp.OC_Facets.TestCategory123456789.color[0]);
            });
        });
        describe('requiredFacet', function(){
            beforeEach(function(){
                facetedProductManageCtrl.requiredFacet(assignedCategory);
           });
            it('should return true', function(){
                expect(facetedProductManageCtrl.requiredFacet(assignedCategory)).toEqual(true);
            })
        });
        describe('saveSelections', function(){
           beforeEach(inject(function($state){
               var defer = q.defer();
               defer.resolve();
               spyOn(oc.Products, 'Update').and.returnValue(defer.promise);
               spyOn($state, 'go').and.returnValue(null);
               facetedProductManageCtrl.saveSelections();
               scope.$digest();
           }));
            it('should call the Products Update method', function(){
               expect(oc.Products.Update).toHaveBeenCalledWith(product.ID, product);
            });
            it('should reload the state', inject(function($state){
               expect($state.go).toHaveBeenCalledWith($state.current, {}, {reload: true});
            }));
        });
        xdescribe('addValueExisting', function(){
            beforeEach(inject(function($state) {
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
                spyOn(oc.Products, 'Update').and.returnValue(defer.promise);
                spyOn($state, 'go').and.returnValue(null);
                //facetedProductManageCtrl.newFacetValue = {
                //    facetName: 'color'
                //};
                //assignedCategory.xp.OC_Facets = {
                //    facetName: 'color'
                //};
                facetedProductManageCtrl.addValueExisting(assignedCategory, facetName);
                scope.$digest();
            }));
            it('should call the Products Update method and add purple to the values', function(){
                expect(oc.Products.Update).toHaveBeenCalledWith(product.ID, product);
                expect(product.xp.OC_Facets.TestCategory123456789.color[1]).toEqual('purple');
                expect(product.xp.OC_Facets.TestCategory123456789.color.length).toEqual(2);
            });
        });
    });
});