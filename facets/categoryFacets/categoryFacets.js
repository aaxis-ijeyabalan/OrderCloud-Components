angular.module('orderCloud')

    .config( CategoryFacetsConfig )
    .controller( 'CategoryFacetsCtrl', CategoryFacetsController)
    .controller( 'CategoryFacetsManageCtrl', FacetedCategoryManageController)

;

function CategoryFacetsConfig( $stateProvider ) {
    $stateProvider
        .state ('categoryFacets', {
        parent: 'base',
        url: '/categoryFacets',
        templateUrl: 'facets/categoryFacets/templates/categoryFacets.tpl.html',
        controller: 'CategoryFacetsCtrl',
        controllerAs: 'facetedCat',
        data: {componentName: 'Category Facets'},
        resolve: {
            CategoryList: function(OrderCloud) {
                return OrderCloud.Categories.List();
            }
        }
    })
    .state ('categoryFacets.manage', {
        url: '/:categoryid/manage',
        templateUrl: 'facets/categoryFacets/templates/categoryFacetsManage.tpl.html',
        controller: 'CategoryFacetsManageCtrl',
        controllerAs: 'facetedCatManage',
        data: {componentName: 'Category Facets'},
        resolve: {
            Category: function(OrderCloud, $stateParams) {
                return OrderCloud.Categories.Get($stateParams.categoryid);
            }
        }
    })
}

function CategoryFacetsController( CategoryList, TrackSearch ) {
    var vm = this;
    vm.list = CategoryList;

    vm.searching = function() {
        return TrackSearch.GetTerm() ? true : false;
    };
}

function FacetedCategoryManageController ( Category, OrderCloud, toastr, $state ) {
    var vm = this;
    Category.xp.Facets ? vm.list = Category.xp.Facets : vm.list = null;
    vm.category = Category;
    vm.facetValues = [];
    vm.isRequired = false;
    vm.addingNewValue = false;


    vm.addValue = function() {
        if(vm.facetValue != null) {
            vm.facetValues.push(vm.facetValue);
            vm.facetValue = null;
        }
    };

    vm.removeValue = function(index) {
        vm.facetValues.splice(index, 1);
    };

    vm.addValueExisting = function (facetName) {
        vm.category.xp.Facets[facetName].Values.push(vm.newFacetValue);
        OrderCloud.Categories.Update(vm.category.ID, vm.category)
            .then(function() {
               vm.newFacetValue = null;
            });
    };

    vm.removeValueExisting = function(facetName, facetValueIndex) {
        vm.category.xp.Facets[facetName].Values.splice(facetValueIndex, 1);
        OrderCloud.Categories.Update(vm.category.ID, vm.category);
    };

    vm.toggleFacetRequired = function() {
            OrderCloud.Categories.Update(vm.category.ID, vm.category);
    };

    vm.deleteFacet = function(facetName, event) {
        if(confirm('Are you sure you want to delete this facet?')) {
            if(Object.keys(vm.category.xp.Facets).length === 1) {
                delete vm.category.xp.Facets;
                OrderCloud.Categories.Update(vm.category.ID, vm.category);
            }
            else {
                delete vm.category.xp.Facets[facetName];
                OrderCloud.Categories.Update(vm.category.ID, vm.category);
            }
            event.stopPropagation();

        }
        else {
            event.stopPropagation();
        }

    };

    vm.save = function() {
        if(vm.category.xp == null) vm.category.xp = { Facets: {}};
        if (vm.category.xp && !vm.category.xp.Facets) vm.category.xp.Facets = {};
        vm.category.xp.Facets[vm.facet.toLowerCase()] = {};
        vm.category.xp.Facets[vm.facet.toLowerCase()].Values = vm.facetValues;
        vm.category.xp.Facets[vm.facet.toLowerCase()].isRequired = vm.isRequired;
        (OrderCloud.Categories.Update(vm.category.ID, vm.category))
            .then(function() {
                toastr.success('Your category facet has been saved successfully')
                vm.facetValues = [];
                vm.facetValue = null;
                vm.isRequired = false;
                vm.facet = null;
                $state.go($state.current, {}, {reload: true})
            });
    };
}
