angular.module('orderCloud')

    .config( FacetedCategoryManagementConfig )
    .controller( 'FacetedCategoryManagementCtrl', FacetedCategoryManagementController)
    .controller( 'FacetedCategoryManagementEditCtrl', FacetedCategoryManagementEditController)
    .controller( 'FacetedCategoryManagementCreateCtrl', FacetedCategoryManagementCreateController)

;

function FacetedCategoryManagementConfig( $stateProvider ) {
    $stateProvider
        .state ('facetedCategoryManagement', {
        parent: 'base',
        url: '/facetedCatMgmt',
        templateUrl: 'facetedFiltering/facetedCategoryManagement/templates/facetedCategoryManagement.tpl.html',
        controller: 'FacetedCategoryManagementCtrl',
        controllerAs: 'facetedCatMgmt',
        data: {componentName: 'Faceted Category Management'},
        resolve: {
            CategoryList: function(OrderCloud) {
                return OrderCloud.Categories.List();
            }
        }
    })
        .state ('facetedCategoryManagement.edit', {
            parent: 'base',
            url: '/facetedCatMgmt/edit',
            templateUrl: 'facetedFiltering/facetedCategoryManagement/templates/facetedCategoryManagementEdit.tpl.html',
            controller: 'FacetedCategoryManagementEditCtrl',
            controllerAs: 'facetedCatMgmtEdit',
            data: {componentName: 'Faceted Category Management'},
            resolve: {}
        })
        .state ('facetedCategoryManagement.create', {
            parent: 'base',
            url: '/facetedCatMgmt/create',
            templateUrl: 'facetedFiltering/facetedCategoryManagement/templates/facetedCategoryManagementCreate.tpl.html',
            controller: 'FacetedCategoryManagementCreateCtrl',
            controllerAs: 'facetedCatMgmtCreate',
            data: {componentName: 'Faceted Category Management'},
            resolve: {
                CategoryList: function(OrderCloud) {
                    return OrderCloud.Categories.List();
                }
            }
        })
}

function FacetedCategoryManagementController() {
    var vm = this;
}

function FacetedCategoryManagementEditController() {
    var vm = this;
}

function FacetedCategoryManagementCreateController ( CategoryList, TrackSearch, Underscore, OrderCloud, toastr, $q ) {
    var vm = this;
    vm.list = CategoryList;
    vm.facetValues = [];
    vm.isRequired = false;

    vm.searching = function() {
        return TrackSearch.GetTerm() ? true : false;
    };

    vm.noCatSelected = true;

    vm.catSelected = function() {
        Underscore.where(vm.list.Items, {selected: true}).length ? vm.noCatSelected = false : vm.noCatSelected = true;
    }

    vm.addValue = function() {
        if(vm.facetValue != null) {
            vm.facetValues.push(vm.facetValue);
            vm.facetValue = null;
        }
    };

    vm.removeValue = function(index) {
        vm.facetValues.splice(index, 1);
    };

    vm.save = function() {
        var dfd = $q.defer();
        var queue = [];
        angular.forEach(Underscore.where(vm.list.Items, {selected: true}), function(category) {
            if(category.xp == null) category.xp = { Facets: {}};
            if (category.xp && !category.xp.Facets) category.xp.Facets = {};
            category.xp.Facets[vm.facet.toLowerCase()] = {};
            category.xp.Facets[vm.facet.toLowerCase()].Values = vm.facetValues;
            category.xp.Facets[vm.facet.toLowerCase()].isRequired = vm.isRequired;
            queue.push(OrderCloud.Categories.Update(category.ID, category))
        });
        $q.all(queue)
            .then(function() {
                toastr.success('Your Category Facet has been saved successfully')
                vm.facetValues = [];
                vm.facetValue = null;
                vm.isRequired = false;
                vm.facet = null;
                angular.forEach(Underscore.where(vm.list.Items, {selected: true}), function(category) {
                category.selected = false;
                });
                dfd.resolve();
            });
        return dfd.promise;
    };
}
