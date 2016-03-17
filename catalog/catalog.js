angular.module('orderCloud')

    .config(CatalogConfig)
    .controller('CatalogCtrl', CatalogController)
    .directive('ordercloudCategoryList', CategoryListDirective)
    .directive('ordercloudProductList', ProductListDirective)
    .factory('CatalogTreeService', CatalogTreeService)
    .directive('catalogNode', CatalogNode)
    .directive('catalogTree', CatalogTree)

;

function CatalogConfig($stateProvider) {
    $stateProvider
        .state('catalog', {
            parent: 'base',
            url: '/catalog',
            data: {componentName: 'Catalog'},
            templateUrl: 'catalog/templates/catalog.tpl.html',
            controller: 'CatalogCtrl',
            controllerAs: 'catalog',
            resolve: {
                Catalog: function($q, OrderCloud) {
                    return OrderCloud.Me.ListCategories(null, 1);
                },
                Order: function($q, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function(order) {
                            dfd.resolve(order);
                        })
                        .catch(function() {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                }
            }
        });
}

function CatalogController(Catalog, Order) {
    var vm = this;
    vm.showTree = true;
    vm.currentOrder = Order;
    vm.toggleTree = function() {
        vm.showTree = !vm.showTree;
    };
    vm.categories = Catalog;
}

function CategoryListDirective() {
    return {
        restrict: 'E',
        templateUrl: 'catalog/templates/category.list.tpl.html',
        scope: {
            categorylist: '='
        }
    };
}

function ProductListDirective() {
    return {
        restrict: 'E',
        templateUrl: 'catalog/templates/product.list.tpl.html',
        scope: {
            productlist: '='
        }
    };
}

function CatalogTreeService($q, Underscore, OrderCloud) {
    return {
        GetCatalogTree: tree
    };

    function tree() {
        var tree = [];
        var dfd = $q.defer();
        OrderCloud.Me.ListCategories(null, 'all', 1, 100)
            .then(function(list) {
                angular.forEach(Underscore.where(list.Items, {ParentID: null}), function(node) {
                    tree.push(getNode(node, list));
                });
                dfd.resolve(tree);
            });
        return dfd.promise;
    }

    function getNode(node, list) {
        var children = Underscore.where(list.Items, {ParentID: node.ID});
        if (children.length > 0) {
            node.children = children;
            angular.forEach(children, function(child) {
                return getNode(child, list);
            });
        }
        else {
            node.children = [];
        }
        return node;
    }
}

function CatalogTree($q, CatalogTreeService) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            tree: '=?'
        },
        link: function(scope) {
            var d = $q.defer();
            if (scope.tree == undefined) {
                CatalogTreeService.GetCatalogTree().then(function(tree) {
                    scope.tree = tree;
                    d.resolve();
                });
            } else {
                d.resolve();

            }
            return d.promise;
        },
        template: "<ul class='nav nav-pills nav-stacked'><catalog-node ng-repeat='node in tree' node='node'></catalog-node></ul>"
    };
}

function CatalogNode($compile) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            node: '='
        },
        template: '<li ui-sref-active="active"><a ui-sref="catalog.category({categoryid:node.ID})" ng-bind-html="node.Name"></a></li>',
        link: function(scope, element) {
            if (angular.isArray(scope.node.children) && scope.node.children.length) {
                element.append("<catalog-tree tree='node.children' />");
                $compile(element.contents())(scope);
            }
        }
    };
}
