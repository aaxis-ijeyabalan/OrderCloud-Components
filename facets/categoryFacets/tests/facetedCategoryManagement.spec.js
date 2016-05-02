fdescribe('Component: Category Facets', function() {
   var scope,
       q,
       category,
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
        var newFacetValue = 'purple';
        beforeEach(inject(function($controller){
            facetedCategoryManageCtrl = $controller('CategoryFacetsManageCtrl', {
                $scope: scope,
                Category: category,
                facetName: 'color'
            });
        }));
        describe('addValueExisting', function(){
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(category);
                spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
                facetedCategoryManageCtrl.addValueExisting(facetedCategoryManageCtrl.facetName, 1);
            });
            it('should call the Categories Update method', function(){
                category.xp.OC_Facets.color.Values.push(newFacetValue);
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
            });
        });
    });
});