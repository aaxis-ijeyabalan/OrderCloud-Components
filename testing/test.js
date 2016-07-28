angular.module('orderCloud')
    .factory('myService', myService)
    .controller('TestController', TestController)
;

function myService() {
    var service = {};
    service.evaluator = function (fruit) {
        if (fruit.length < 6) {
            return fruit + ' are delicious'
        } else {
            return fruit + ' are gross'
        }
    };
    return serviceangular.module('orderCloud')
        .factory('myService', myService)
        .controller('TestController', TestController)
        ;

    function myService() {
        var service = {};
        service.evaluator = function (fruit) {
            if (fruit.length < 6) {
                return fruit + ' are delicious'
            } else {
                return fruit + ' are gross'
            }
        };
        return service
    }

    function TestController(myService, $q, OrderCloud){
        var vm = this;
        vm.statement = function(fruit){
            var dfd = $q.defer();
            var message = myService.evaluator(fruit);
            OrderCloud.Me.Get()
                .then(function(data){
                    dfd.resolve(data.FirstName + ' thinks ' + message)
                });
            return dfd.promise
        };
    }



}

function TestController(myService, $q, OrderCloud){
    var vm = this;
    vm.statement = function(fruit){
        var dfd = $q.defer();
        var message = myService.evaluator(fruit);
        OrderCloud.Me.Get()
            .then(function(data){
                dfd.resolve(data.FirstName + ' thinks ' + message)
            });
        return dfd.promise
    };
}


