angular.module('orderCloud')
    .config (SearchConfig)
    .directive( 'ordercloudStandardSearch', ordercloudStandardSearch)
    .controller( 'ordercloudStandardSearchCtrl', ordercloudStandardSearchController)
    .controller('SearchResultsCtrl', SearchResultsController)
;

function SearchConfig($stateProvider) {
    $stateProvider
        .state('results', {
            parent:'base',
            url: '/standardSearch/:searchterm',
            templateUrl:'standardSearch/templates/results.tpl.html',
            controller: 'SearchResultsCtrl',
            controllerAs: 'results',
            resolve:{
                CategoryList: function(OrderCloud, $stateParams) {
                    return OrderCloud.Me.ListCategories($stateParams.searchterm, 'all');
                },
                ProductList: function (OrderCloud, $stateParams) {
                    return OrderCloud.Me.ListProducts($stateParams.searchterm);
                }
            }
        });
}
function ordercloudStandardSearch () {
    return {
        scope: {
            maxprod: "@",
            maxcat: '@'
        },
        restrict: 'E',
        templateUrl: 'standardSearch/templates/directive.html',
        controller: 'ordercloudStandardSearchCtrl',
        controllerAs: 'SS',
        replace: true
    }
}


function ordercloudStandardSearchController($state, $scope, $q, OrderCloud) {

    var vm = this;
    vm.typeAhead = function(term){

        var maxProducts = $scope.maxprod || 5;
        var maxCategories = $scope.maxcat || 5;
        var dfd = $q.defer();

        $q.all([OrderCloud.Me.ListProducts(term, null, 1, maxProducts), OrderCloud.Me.ListCategories(term, 'all', 1, maxCategories)])
            .then(function (responses) {

                var productData = responses[0].Items;
                productData.length ? productData[0].firstInGroup = true : angular.noop();

                angular.forEach(productData, function (product) {
                    product.NameType = "Product";
                });

                var categoryData = responses[1].Items;
                categoryData.length ? categoryData[0].firstInGroup = true : angular.noop();

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

    vm.searchMore = function(search){
        $state.go('results', {searchterm:search}, {reload:true} );
    };
}


function SearchResultsController($q, OrderCloud, CategoryList, ProductList, TrackSearch){

    var vm =this;
    vm.products={};
    vm.categories={};

    vm.products.list = ProductList;
    vm.categories.list = CategoryList;

    vm.updateResults = function(term){
        var dfd = $q.defer();
        $q.all([OrderCloud.Me.ListProducts(term), OrderCloud.Me.ListCategories(term, 'all')])
            .then(function (responses) {

                vm.products.list = responses[0];
                vm.categories.list = responses[1];
                dfd.resolve(responses);
            });
        return dfd.promise;
    };


    vm.searching = function(){
        return TrackSearch.GetTerm() ? true : false;
    };

}