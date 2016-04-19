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

function ordercloudQuickviewDirective(){
    return{
        scope:{
            product: '='
        },
        restrict:'E',
        templateUrl:'standardSearch/templates/catalogSearch.quickview.tpl.html',
        controller:'QuickviewCtrl',
        controllerAs:'quickview'
    }
}

function QuickviewController ($uibModal){
    var vm = this;
    vm.open = function (product){
        $uibModal.open({
            animation:true,
            size:'lg',
            templateUrl: 'standardSearch/templates/catalogSearch.quickviewModal.tpl.html',
            controller: 'QuickviewModalCtrl',
            controllerAs: 'quickviewModal',
            resolve: {
                SelectedProduct: function (OrderCloud) {
                    return OrderCloud.Me.GetProduct(product.ID);
                },
                SpecList: function(OrderCloud, $q) {
                    var queue = [];
                    var dfd = $q.defer();
                    OrderCloud.Specs.ListProductAssignments(null, product.ID)
                        .then(function(data) {
                            angular.forEach(data.Items, function(assignment) {
                                queue.push(OrderCloud.Specs.Get(assignment.SpecID));
                            });
                            $q.all(queue)
                                .then(function(result) {
                                    angular.forEach(result, function(spec) {
                                        spec.Value = spec.DefaultValue;
                                        spec.OptionID = spec.DefaultOptionID;
                                    });
                                    dfd.resolve(result);
                                });
                        })
                        .catch(function(response) {

                        });
                    return dfd.promise;
                }
            }
        });
    };
}

function QuickviewModalController($uibModalInstance, SelectedProduct, SpecList, AddToOrder){
    var vm = this;
    vm.selectedProduct = SelectedProduct;
    vm.selectedProduct.item = {Specs: SpecList};
    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    vm.addToCart = function(product) {
        product.Quantity = product.item.Quantity;
        product.Specs = product.item.Specs;
        AddToOrder.Add(product).then(function(){
            $uibModalInstance.close()
        });
    };
}