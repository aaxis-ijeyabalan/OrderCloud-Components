fdescribe('My test!', function(){
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    var mockMyService
        ;

    beforeEach(inject(function(myService){
        mockMyService = myService;
    }));

    describe('Service: myService', function(){
        it('should tell me kiwis are delicious', function(){
            expect(mockMyService.evaluator('kiwis')).toEqual('kiwis are delicious');
        });
        it('should not tell me that kiwis are gross ', function(){
            expect(mockMyService.evaluator('kiwis')).not.toEqual('kiwis are gross');
        });
        it('should tell me that apples are gross', function(){
            expect(mockMyService.evaluator('apples')).toEqual('apples are gross')
        })
    });

    describe('Controller: TestController', function(){
        var MockTestCtrl,
            q,
            scope,
            oc
            ;

        beforeEach(inject(function($controller, myService, $q, $rootScope, OrderCloud){
            q = $q;
            scope = $rootScope.$new();
            oc = OrderCloud;
            mockMyService = myService;
            MockTestCtrl = $controller('TestController', {
                myService: mockMyService,
                $q: q,
                OrderCloud: oc
            })
        }));
        describe('Method: statement', function(){
            beforeEach(function(){
                var defer = q.defer();
                defer.resolve({FirstName: 'Crhistian'});
                spyOn(mockMyService, 'evaluator');
                spyOn(oc.Me, 'Get').and.returnValue(defer.promise)
            });

            it('should call OrderCloud.Me', function(){
                MockTestCtrl.statement('apple');
                scope.$digest();
                expect(mockMyService.evaluator).toHaveBeenCalledWith('apple');
                expect(oc.Me.Get).toHaveBeenCalled();
            });
        })
    });
});

