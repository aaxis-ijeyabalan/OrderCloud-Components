angular.module('orderCloud')
    .config(PromotionsConfig)
    .controller('PromotionsCtrl', PromotionsController)
    .controller('PromotionEditCtrl', PromotionEditController)
    .controller('PromotionCreateCtrl', PromotionCreateController)
    .controller('PromotionAssignGroupCtrl', PromotionAssignGroupController)
    .controller('PromotionAssignUserCtrl', PromotionAssignUserController)
    .factory('PromotionAssignment', PromotionAssignment)
    .controller('PromotionInputCtrl', PromotionInputController)
    .directive('ordercloudPromotionInput', OrdercloudPromotionInputDirective)
    .controller('RemovePromotionCtrl', RemovePromotionController)
    .directive('ordercloudRemovePromotion', OrdercloudRemovePromotionDirective)
    .factory('OrderCloudExpressions', OrderCloudExpressionsService)
;

function PromotionsConfig($stateProvider) {
    $stateProvider
        .state('promotions', {
            parent: 'base',
            templateUrl: 'promotions/templates/promotions.tpl.html',
            controller: 'PromotionsCtrl',
            controllerAs: 'promotions',
            url: '/promotions?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Promotions'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                PromotionList: function(OrderCloud, Parameters) {
                    return OrderCloud.Promotions.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('promotions.edit', {
            url: '/:promotionid/edit',
            templateUrl: 'promotions/templates/promotionEdit.tpl.html',
            controller: 'PromotionEditCtrl',
            controllerAs: 'promotionEdit',
            resolve: {
                SelectedPromotion: function($q, $stateParams, OrderCloud) {
                    var d = $q.defer();
                    OrderCloud.Promotions.Get($stateParams.promotionid)
                        .then(function(promotion) {
                            if (promotion.StartDate != null)
                                promotion.StartDate = new Date(promotion.StartDate);
                            if (promotion.ExpirationDate != null)
                                promotion.ExpirationDate = new Date(promotion.ExpirationDate);
                            d.resolve(promotion);
                        });
                    return d.promise;
                }
            }
        })
        .state('promotions.create', {
            url: '/create',
            templateUrl: 'promotions/templates/promotionCreate.tpl.html',
            controller: 'PromotionCreateCtrl',
            controllerAs: 'promotionCreate'
        })
        .state('promotions.assignGroup', {
            url: '/:promotionid/assign',
            templateUrl: 'promotions/templates/promotionAssignGroup.tpl.html',
            controller: 'PromotionAssignGroupCtrl',
            controllerAs: 'promotionAssignGroup',
            resolve: {
                UserGroupList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List();
                },
                AssignedUserGroups: function($stateParams, OrderCloud) {
                    return OrderCloud.Promotions.ListAssignments($stateParams.promotionid, null, null, 'Group');
                },
                SelectedPromotion: function($stateParams, OrderCloud) {
                    return OrderCloud.Promotions.Get($stateParams.promotionid);
                }
            }
        })
        .state('promotions.assignUser', {
            url: '/:promotionid/assign/user',
            templateUrl: 'promotions/templates/promotionAssignUser.tpl.html',
            controller: 'PromotionAssignUserCtrl',
            controllerAs: 'promotionAssignUser',
            resolve: {
                UserList: function(OrderCloud) {
                    return OrderCloud.Users.List();
                },
                AssignedUsers: function($stateParams, OrderCloud) {
                    return OrderCloud.Promotions.ListAssignments($stateParams.promotionid, null, null, 'User');
                },
                SelectedPromotion: function($stateParams, OrderCloud) {
                    return OrderCloud.Promotions.Get($stateParams.promotionid);
                }
            }
        })
    ;
}

function PromotionsController($state, $ocMedia, OrderCloud, OrderCloudParameters, PromotionList, Parameters) {
    var vm = this;
    vm.list = PromotionList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch (vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //Used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page: vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.Promotions.List(parameters.search, vm.list.Meta.Page + 1, parameters.pageSize || vm.list.Meta.PageSize, parameters.searchOn, parameters.sortBy, parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function PromotionEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedPromotion) {
    var vm = this,
        promotionid = SelectedPromotion.ID;
    vm.promotionName = SelectedPromotion.Name;
    vm.promotion = SelectedPromotion;

    vm.Submit = function() {
        OrderCloud.Promotions.Update(promotionid, vm.promotion)
            .then(function() {
                $state.go('promotions', {}, {reload: true});
                toastr.success('Promotion Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.Delete = function() {
        OrderCloud.Promotions.Delete(promotionid)
            .then(function() {
                $state.go('promotions', {}, {reload: true});
                toastr.success('Promotion Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function PromotionCreateController($exceptionHandler, $state, $scope, toastr, OrderCloud, OrderCloudExpressions) {
    var vm = this;
    vm.promotion = {xp: {}};
    vm.expressionObjects = OrderCloudExpressions.Objects();
    vm.eligibleConditions = [];

    vm.overrideEligibleExpression = function() {
        vm.promotion.xp.OverrideEligibleExpression = !vm.promotion.xp.OverrideEligibleExpression;
        vm.eligibleConditions = [];
    };

    vm.addEligibleCondition = function(logicalOperator) {
        if (logicalOperator) {
            vm.eligibleConditions.push({
                Value: logicalOperator,
                LogicalOperator: true
            });
        }
        vm.eligibleConditions.push({
            Object: null,
            Function: null,
            Property: null,
            XPProperty: null,
            ItemConditions: [{Property: null, XPProperty: null, Operator: null, Value: null, ValueType: 'String', LogicalOperator: false, DatePickerOpen: false}],
            Operator: null,
            Value: null,
            ValueType: 'String',
            LogicalOperator: false,
            DatePickerOpen: false
        });
    };

    vm.removeEligibleCondition = function(index) {
        vm.eligibleConditions.splice(index - 1, 2);
    };

    vm.updateEligibleExpressionObject = function(index) {
        vm.eligibleConditions[index].Function = null;
        vm.eligibleConditions[index].Property = null;
        vm.eligibleConditions[index].XPProperty = null;
        vm.eligibleConditions[index].ItemConditions = [{Property: null, XPProperty: null, Operator: null, Value: null, ValueType: 'String', LogicalOperator: false, DatePickerOpen: false}];
        vm.eligibleConditions[index].Operator = null;
        vm.eligibleConditions[index].Value = null;
        vm.eligibleConditions[index].ValueType = 'String';
        vm.eligibleConditions[index].LogicalOperator = false;
        vm.eligibleConditions[index].DatePickerOpen = false;
    };

    vm.addEligibleConditionItemCondition = function(logicalOperator, parentIndex) {
        if (logicalOperator) {
            vm.eligibleConditions[parentIndex].ItemConditions.push({
                Value: logicalOperator,
                LogicalOperator: true
            });
        }
        vm.eligibleConditions[parentIndex].ItemConditions.push({
            Property: null,
            XPProperty: null,
            Operator: null,
            Value: null,
            ValueType: 'String',
            LogicalOperator: false,
            DatePickerOpen: false
        });
    };

    vm.removeEligibleConditionItemCondition = function(parentIndex, index) {
        vm.eligibleConditions[parentIndex].ItemConditions.splice(index - 1, 2);
    };

    vm.changeEligibleConditionValueType = function(type, index) {
        vm.eligibleConditions[index].ValueType = type;
        vm.eligibleConditions[index].Value = null;
    };

    vm.changeEligibleConditionItemConditionValueType = function(type, parentIndex, index) {
        vm.eligibleConditions[parentIndex].ItemConditions[index].ValueType = type;
        vm.eligibleConditions[parentIndex].ItemConditions[index].Value = null;
    };

    vm.openEligibleConditionDate = function(index) {
        angular.forEach(vm.eligibleConditions, function(condition) {
            condition.DatePickerOpen = false;
        });
        vm.eligibleConditions[index].DatePickerOpen = true;
    };

    vm.openEligibleConditionItemConditionDate = function(parentIndex, index) {
        angular.forEach(vm.eligibleConditions, function(condition) {
            angular.forEach(condition.ItemConditions, function(ic) {
               ic.DatePickerOpen = false;
            });
        });
        vm.eligibleConditions[parentIndex].ItemConditions[index].DatePickerOpen = true;
    };

    $scope.$watch(function () {
        return vm.eligibleConditions;
    },function(conditions){
        updateEligibleExpression(conditions);
    }, true);

    function updateEligibleExpression(conditions) {
        if (vm.promotion.xp.OverrideEligibleExpression) return;
        vm.promotion.EligibleExpression = OrderCloudExpressions.TranslateEligibleExpression(conditions);
    }

    vm.Submit = function() {
        if (!vm.promotion.xp.OverrideEligibleExpression) {
            vm.promotion.xp.EligibleConditions = vm.eligibleConditions;
        }
        OrderCloud.Promotions.Create(vm.promotion)
            .then(function() {
                $state.go('promotions', {}, {reload: true});
                toastr.success('Promotion Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function PromotionAssignGroupController($scope, toastr, UserGroupList, AssignedUserGroups, SelectedPromotion, PromotionAssignment) {
    var vm = this;
    vm.list = UserGroupList;
    vm.assignments = AssignedUserGroups;
    vm.promotion = SelectedPromotion;
    vm.pagingfunction = PagingFunction;
    vm.saveAssignments = SaveAssignments;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        PromotionAssignment.SetSelected(vm.list.Items, vm.assignments.Items);
    });

    function SaveAssignments() {
        toastr.success('Assignment Updated', 'Success');
        return PromotionAssignment.SaveAssignments(vm.promotion.ID, vm.list.Items, vm.assignments.Items);
    }

    function PagingFunction() {
        return PromotionAssignment.Paging(vm.promotion.ID, vm.list, vm.assignments);
    }
}

function PromotionAssignUserController($scope, toastr, Paging, UserList, AssignedUsers, SelectedPromotion, PromotionAssignment) {
    var vm = this;
    vm.list = UserList;
    vm.assignments = AssignedUsers;
    vm.promotion = SelectedPromotion;
    vm.pagingfunction = PagingFunction;
    vm.saveAssignments = SaveAssignments;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserID');
    });

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        PromotionAssignment.SetSelected(vm.list.Items, vm.assignments.Items, 'User');
    });

    function SaveAssignments() {
        toastr.success('Assignment Updated', 'Success');
        return PromotionAssignment.SaveAssignments(vm.promotion.ID, vm.list.Items, vm.assignments.Items, 'User');
    }

    function PagingFunction() {
        return PromotionAssignment.Paging(vm.promotion.ID, vm.list, vm.assignments, 'User');
    }
}

function PromotionAssignment($q, $state, $injector, Underscore, OrderCloud, Assignments) {
    return {
        SaveAssignments: _saveAssignments,
        SetSelected: _setSelected,
        Paging: _paging
    };

    function _saveAssignments(PromotionID, List, AssignmentList, Party) {
        var PartyID = (Party === 'User') ? 'UserID' : 'UserGroupID';
        var assigned = Underscore.pluck(AssignmentList, PartyID);
        var selected = Underscore.pluck(Underscore.where(List, {selected: true}), 'ID');
        var toAdd = Assignments.GetToAssign(List, AssignmentList, PartyID);
        var toDelete = Assignments.GetToDelete(List, AssignmentList, PartyID);
        var queue = [];
        var dfd = $q.defer();
        angular.forEach(List, function(item) {
            if (toAdd.indexOf(item.ID) > -1) {
                saveAndUpdate(queue, PromotionID, item, Party);
            }
        });
        angular.forEach(toDelete, function(itemID) {
            if (Party === 'User') {
                queue.push(OrderCloud.Promotions.DeleteAssignment(PromotionID, itemID, null));
            }
            else queue.push(OrderCloud.Promotions.DeleteAssignment(PromotionID, null, itemID));
        });
        $q.all(queue).then(function() {
            dfd.resolve();
            $state.reload($state.current);
        });
        return dfd.promise;
    }

    function saveAndUpdate(queue, PromotionID, item, Party) {
        var assignment = {
            PromotionID: PromotionID,
            UserID: null,
            UserGroupID: null
        };
        if (Party === 'User') {
            assignment.UserID = item.ID;
        }
        else assignment.UserGroupID = item.ID;
        queue.push(OrderCloud.Promotions.SaveAssignment(assignment));
    }

    function _setSelected(List, AssignmentList, Party) {
        var PartyID = (Party === 'User') ? 'UserID' : 'UserGroupID';
        var assigned = Assignments.GetAssigned(AssignmentList, PartyID);
        angular.forEach(List, function(item) {
            if (assigned.indexOf(item.ID) > -1) {
                item.selected = true;
            }
        });
    }

    function _paging(PromotionID, OrderCloud, ListObjects, AssignmentObjects, Party) {
        var ServiceName = (Party === 'User') ? 'Users' : 'UserGroups';
        var Level = (Party === 'User') ? 'User' : 'Group';
        var Service = $injector.get(ServiceName);
        if (ListObjects.Meta.Page < ListObjects.Meta.TotalPages) {
            var queue = [];
            var dfd = $q.defer();
            queue.push(Service.List(null, ListObjects.Meta.Page + 1, ListObjects.Meta.PageSize));
            if (AssignmentObjects.Meta.Page < AssignmentObjects.Meta.TotalPages) {
                queue.push(OrderCloud.Promotions.ListAssignments(PromotionID, null, null, Level, AssignmentObjects.Meta.Page + 1, AssignmentObjects.Meta.PageSize));
            }
            $q.all(queue).then(function(results) {
                dfd.resolve();
                ListObjects.Meta = results[0].Meta;
                ListObjects.Items = [].concat(ListObjects.Items, results[0].Items);
                if (results[1]) {
                    AssignmentObjects.Meta = results[1].Meta;
                    AssignmentObjects.Items = [].concat(AssignmentObjects.Items, results[1].Items);
                }
                _setSelected(ListObjects.Items, AssignmentObjects.Items, Party);
            });
            return dfd.promise;
        }
        else return null;
    }
}

function PromotionInputController($scope, $state, toastr, OrderCloud) {
    var vm = this;

    vm.Submit = function() {
        OrderCloud.Orders.AddPromotion($scope.order.ID, vm.code)
            .then(function(promo) {
                $state.reload();
                toastr.success(promo.Name + ' has been added.', 'Success')
            })
            .catch(function(ex) {
                toastr.error(ex.data.Errors[0].Message, 'Error');
                vm.code = null;
            });
    };
}

function OrdercloudPromotionInputDirective() {
    return {
        restrict: 'E',
        scope: {
            order: '=',
            orderpromotions: '='
        },
        replace: true,
        templateUrl: 'promotions/templates/promotion-input.tpl.html',
        controller: 'PromotionInputCtrl',
        controllerAs: 'promotionInput'
    };
}

function RemovePromotionController($scope, $state, toastr, OrderCloud) {
    var vm = this;

    vm.Remove = function() {
        OrderCloud.Orders.RemovePromotion($scope.order.ID, $scope.promotion.Code)
            .then(function() {
                $state.reload();
            })
            .catch(function(ex) {
                toastr.error(ex.data.Errors[0].Message, 'Error');
            });
    };
}

function OrdercloudRemovePromotionDirective() {
    return {
        restrict: 'E',
        scope: {
            order: '=',
            promotion: '='
        },
        replace: true,
        templateUrl: 'promotions/templates/remove-promotion.tpl.html',
        controller: 'RemovePromotionCtrl',
        controllerAs: 'removePromotion'
    }
}

function OrderCloudExpressionsService($filter) {
    var service = {
        Objects: _objects,
        TranslateEligibleExpression: _translateEligibleExpression
    };

    function _objects() {
        return [
            {
                Name: 'Order',
                Value: 'order',
                Properties: [
                    {
                        Name: 'Billing Address ID',
                        Value: 'BillingAddressID',
                        Operators: ['=']
                    },
                    {
                        Name: 'Date Created',
                        Value: 'DateCreated',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Line Item Count',
                        Value: 'LineItemCount',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Subtotal',
                        Value: 'Subtotal',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Shipping Cost',
                        Value: 'ShippingCost',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Total',
                        Value: 'Total',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Extended Property',
                        Value: 'xp',
                        Operators: ['=', '>', '>=', '<', '<=']
                    }
                ]
            },
            {
                Name: 'Line Items',
                Value: 'items',
                Functions: [
                    {
                        Name: 'Any',
                        Value: 'any',
                        Operators: []
                    },
                    {
                        Name: 'All',
                        Value: 'all',
                        Operators: []
                    },
                    {
                        Name: 'Quantity',
                        Value: 'quantity',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Total',
                        Value: 'total',
                        Operators: ['=', '>', '>=', '<', '<=']
                    }
                ],
                Properties: [
                    {
                        Name: 'Product ID',
                        Value: 'ProductID',
                        Operators: ['=']
                    },
                    {
                        Name: 'Quantity',
                        Value: 'Quantity',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Line Total',
                        Value: 'LineTotal',
                        Operators: ['=', '>', '>=', '<', '<=']
                    },
                    {
                        Name: 'Shipping Address ID',
                        Value: 'ShippingAddressID',
                        Operators: ['=']
                    },
                    {
                        Name: 'Extended Property',
                        Value: 'xp',
                        Operators: ['=', '>', '>=', '<', '<=']
                    }
                ],
                Operators: ['=', '>', '>=', '<', '<=']
            }
        ];
    }

    function _translateEligibleExpression(conditions) {
        var result = '';
        angular.forEach(conditions, function(condition) {
            if (condition.LogicalOperator) {
                result += ' ' + condition.Value + ' ';
            } else {
                if (condition.Object && condition.Property && !condition.Operator && condition.Property.Operators.length == 1) {
                    condition.Operator = condition.Property.Operators[0];
                }
                result += (condition.Object ? condition.Object.Value : '');
                if (condition.Object && condition.Object.Value == 'order') {
                    result += (condition.Property ? ('.' + condition.Property.Value) : '');
                    result += ((condition.Property && condition.Property.Value == 'xp') ? ('.' + (condition.XPProperty ? condition.XPProperty : '')) : '');
                    result += (condition.Operator ? (' ' + condition.Operator) : '');
                    if (condition.Value) {
                        result += ' ';
                        switch (condition.ValueType) {
                            case 'String':
                                result += "'" + condition.Value.replace(/['"]/g, '') + "'";
                                break;
                            case 'Number':
                                result += condition.Value;
                                break;
                            case 'Date':
                                result += '#' + $filter('date')(condition.Value, 'shortDate') + '#';
                                break;
                        }
                    }
                } else if (condition.Object && condition.Object.Value == 'items') {
                    result += (condition.Function ? ('.' + condition.Function.Value + (!condition.ItemConditions[0].Property ? '()' : '')) : '');
                    if (condition.ItemConditions[0].Property) {
                        result += '(';
                        angular.forEach(condition.ItemConditions, function(c) {
                            if (c.LogicalOperator) {
                                result += ' ' + c.Value + ' ';
                            }
                            else {
                                if (c.Property && c.Property.Operators.length == 1) {
                                    c.Operator = c.Property.Operators[0];
                                }
                                result += (c.Property ? c.Property.Value : '');
                                result += ((c.Property && c.Property.Value == 'xp') ? ('.' + (c.XPProperty ? c.XPProperty : '')) : '');
                                result += (c.Operator ? (' ' + c.Operator + ' ') : '');
                                if (c.Value) {
                                    switch (c.ValueType) {
                                        case 'String':
                                            result += "'" + c.Value.replace(/['"]/g, '') + "'";
                                            break;
                                        case 'Number':
                                            result += c.Value;
                                            break;
                                        case 'Date':
                                            result += '#' + $filter('date')(c.Value, 'shortDate') + '#';
                                            break;
                                    }
                                }
                            }
                        });
                        result += ')';
                    }
                    result += ((condition.Operator && condition.Function.Operators.length > 0) ? (' ' + condition.Operator) : '');
                    if (condition.Value && condition.Function && condition.Function.Operators.length > 0) {
                        result += ' ';
                        switch (condition.ValueType) {
                            case 'String':
                                result += "'" + condition.Value.replace(/['"]/g, '') + "'";
                                break;
                            case 'Number':
                                result += condition.Value;
                                break;
                            case 'Date':
                                result += '#' + $filter('date')(condition.Value, 'shortDate') + '#';
                                break;
                        }
                    }
                }
            }
        });
        return result;
    }

    return service;
}