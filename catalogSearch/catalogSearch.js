angular.module('orderCloud')
    .config (catalogSearchConfig)
    .directive( 'ordercloudCatalogSearch', ordercloudCatalogSearchDirective)
    .controller( 'CatalogSearchCtrl', CatalogSearchController)
    .controller('CatalogSearchResultsCtrl', CatalogSearchResultsController)
    .directive( 'ordercloudQuickview', ordercloudQuickviewDirective)
    .controller( 'QuickviewCtrl', QuickviewController)
    .controller ('QuickviewModalCtrl', QuickviewModalController)
;

function catalogSearchConfig($stateProvider) {
    $stateProvider
        .state('catalogSearchResults', {
            parent:'base',
            url: '/catalogSearchResults/:searchterm',
            templateUrl:'catalogSearch/templates/catalogSearchResults.tpl.html',
            controller: 'CatalogSearchResultsCtrl',
            controllerAs: 'CatalogSearchResults',
            resolve:{
                CategoryList: function($stateParams, OrderCloud) {
                    return OrderCloud.Me.ListCategories($stateParams.searchterm, 'all');
                },
                ProductList: function ($stateParams, OrderCloud) {
                    return OrderCloud.Me.ListProducts($stateParams.searchterm);
                }
            }
        });
}
function ordercloudCatalogSearchDirective () {
    return {
        scope: {
            maxprods: "@",
            maxcats: '@'
        },
        restrict: 'E',
        templateUrl: 'catalogSearch/templates/catalogSearchDirective.tpl.html',
        controller: 'CatalogSearchCtrl',
        controllerAs: 'CatalogSearch',
        replace: true
    }
}

function CatalogSearchController($scope, $state, $q, OrderCloud) {
    var vm = this;
    vm.popupResults = function (term) {
        console.log(term);
        var maxProducts = $scope.maxprods || 5;
        var maxCategories = $scope.maxcats || 5;
        var dfd = $q.defer();
        var queue = [];

        queue.push(OrderCloud.Me.ListProducts(term, null, 1, maxProducts));
        queue.push(OrderCloud.Me.ListCategories(term, 'all', 1, maxCategories));

        $q.all(queue)
            .then(function (responses) {

                var productData = responses[0].Items;
                var categoryData = responses[1].Items;

                angular.forEach(productData, function (product) {
                    product.NameType = "Product";
                });

                angular.forEach(categoryData, function (category) {
                    category.NameType = "Category";
                });

                var collected = productData.concat(categoryData);
                dfd.resolve(collected);
            });
        return dfd.promise;
    };

    vm.onSelect = function($item){
        ($item.NameType === 'Category') ? $state.go('catalog.category', {categoryid: $item.ID}) : $state.go('catalog.product', {productid: $item.ID});
    };

    vm.onHardEnter = function(search){
        $state.go('catalogSearchResults', {searchterm:search}, {reload:true} );
    };
}

function CatalogSearchResultsController(CategoryList, ProductList) {
    var vm = this;
    vm.products = ProductList;
    vm.categories = CategoryList;
}

