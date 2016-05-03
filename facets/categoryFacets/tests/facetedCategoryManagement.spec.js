describe('Component: Category Facets', function() {
   var scope,
       q,
       category,
       matchingProds,
       oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        category = {
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
        matchingProds = {
          Meta: {},
            Items: [
                {
                    ID: 'prod123465789',
                    xp: {
                        OC_Facets: {
                            TestCategory123456789: {
                                color: ['blue']
                            }
                        }
                    }
                }
            ]

        };
        oc = OrderCloud;
    }));
    describe('State: categoryFacets', function() {
       var state;
        beforeEach(inject(function($state) {
            state = $state.get('categoryFacets')
            spyOn(oc.Categories, 'List').and.returnValue(null);
        }));
        it('should resolve CategoryList', inject(function($injector){
            $injector.invoke(state.resolve.CategoryList);
            expect(oc.Categories.List).toHaveBeenCalledWith(null, 'all');
        }));
    });
    describe('State: categoryFacets.manage', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('categoryFacets.manage')
            spyOn(oc.Categories, 'Get').and.returnValue(null);
        }));
        it('should resolve Category', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.Category);
            expect(oc.Categories.Get).toHaveBeenCalledWith($stateParams.categoryid);
        }));
    });
    describe('Controller: FacetedCategoryManageController', function() {
        var facetedCategoryManageCtrl;
        beforeEach(inject(function($controller){
            facetedCategoryManageCtrl = $controller('CategoryFacetsManageCtrl', {
                $scope: scope,
                Category: category
            });
            facetedCategoryManageCtrl.facetName = 'color'
        }));
        describe('addValueExisting', function(){
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(category);
                facetedCategoryManageCtrl.color = {
                    newFacetValue: 'Purple'
                };
                spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
                facetedCategoryManageCtrl.addValueExisting(facetedCategoryManageCtrl.facetName, 1);
            });
            it('should call the Categories Update method and add purple to the values', function(){
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.Values[3]).toEqual('purple');
                expect(category.xp.OC_Facets.color.Values.length).toEqual(4);
            });
        });
        describe('removeValueExisting', function(){
            beforeEach(function() {
                spyOn(oc.Categories, 'Update').and.returnValue(null);
                facetedCategoryManageCtrl.removeValueExisting(facetedCategoryManageCtrl.facetName, 3);
            });
            it('should call the Categories Update method and remove blue from the values', function(){
                category.xp.OC_Facets.color.Values.splice(2, 1);
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.Values.indexOf('blue')).toEqual(-1);
                expect(category.xp.OC_Facets.color.Values.length).toEqual(2);
            });
        });
        describe('toggleFacetRequired', function(){
            beforeEach(function() {
                spyOn(oc.Categories, 'Update').and.returnValue(null);
                facetedCategoryManageCtrl.toggleFacetRequired(facetedCategoryManageCtrl.facetName);
            });
            it('should call the Categories Update method and toggle isRequired', function(){
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.isRequired).toEqual(true);
                facetedCategoryManageCtrl.toggleFacetRequired(facetedCategoryManageCtrl.facetName);
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.isRequired).toEqual(false);
            });
        });
        describe('deleteFacet', function(){
           beforeEach(function(){
               var defer = q.defer();
               defer.resolve();
               var proddfd = q.defer();
               proddfd.resolve(matchingProds);
               spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
               spyOn(oc.Products, 'List').and.returnValue(proddfd.promise);
               spyOn(oc.Products, 'Update').and.returnValue(null);
               spyOn(window, 'confirm').and.returnValue(true);
               facetedCategoryManageCtrl.deleteFacet(facetedCategoryManageCtrl.facetName);
           });
            it('should call the Categories Update method', function(){
                delete category.xp.OC_Facets;
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                scope.$digest();
                //var keyName = {
                //    xp: {
                //        OC_Facets: {
                //            TestCategory123456789: {
                //                color: ['blue']
                //            }
                //        }
                //    }
                //};
                var filterObj = 'xp.OC_Facets.TestCategory123456789.color: *';

                expect(oc.Products.List).toHaveBeenCalledWith(null, 1, 100, null, null, filterObj);
                delete matchingProds.Items[0].xp.OC_Facets.TestCategory123456789;
                expect(oc.Products.Update).toHaveBeenCalledWith(matchingProds.ID, matchingProds)
            });
            //it('should call the Products List method', function(){
            //    expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
            //});
        });
    });
});