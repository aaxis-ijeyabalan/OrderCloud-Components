angular.module('orderCloud')
    .factory('PriceBreak', PriceBreakFactory);

function PriceBreakFactory (Underscore) {
    var service = {
        addPriceBreak : addPriceBreak,
        setMinMax: setMinMax,
        deletePriceBreak: deletePriceBreak,
        addDisplayQuantity:addDisplayQuantity
    };

    function setMinMax(priceSchedule) {
            var quantities =  _.pluck(priceSchedule.PriceBreaks, 'Quantity');
            priceSchedule.MinQuantity = _.min(quantities);
        if (priceSchedule.RestrictedQuantity) {
            priceSchedule.MaxQuantity = _.max(quantities);
        }
        return priceSchedule;
    }

    function addPriceBreak( priceSchedule, price, quantity) {

        priceSchedule.PriceBreaks.push({Price: price, Quantity: quantity});

        displayQuantity(priceSchedule);

        return setMinMax(priceSchedule);
    }

    function addDisplayQuantity(priceSchedule){

        displayQuantity(priceSchedule);

        return setMinMax(priceSchedule);

    }

    function deletePriceBreak(priceSchedule, index) {
        priceSchedule.PriceBreaks.splice(index, 1);
        return setMinMax(priceSchedule);
    }


    function displayQuantity(priceSchedule){
        priceSchedule.PriceBreaks.sort(function(a,b){return a.Quantity - b.Quantity});



        for(var i=0; i < priceSchedule.PriceBreaks.length; i++){

            var maxQuantity = Math.max.apply(Math,priceSchedule.PriceBreaks.map(function(object){
                return object.Quantity}));


            console.log("this is y", y);
            //if max number and is unique, display max number  with + symbol
            if(priceSchedule.PriceBreaks[i].Quantity == maxQuantity) {
                priceSchedule.PriceBreaks[i].displayQuantity= priceSchedule.PriceBreaks[i].Quantity + "+";

            }else{
                var itemPriceRange = Underscore.range(priceSchedule.PriceBreaks[i].Quantity,priceSchedule.PriceBreaks[i + 1].Quantity);
                itemPriceRange;

                if(itemPriceRange.length === 1){
                    priceSchedule.PriceBreaks[i].displayQuantity = itemPriceRange[0];
                }else{
                    //if price range = 0 display one number
                    if(((priceSchedule.PriceBreaks[priceSchedule.PriceBreaks.length-1]).Quantity - itemPriceRange[0]) <= 1){
                        priceSchedule.PriceBreaks[i].displayQuantity = itemPriceRange[0];
                        //displays range
                    }else{
                        priceSchedule.PriceBreaks[i].displayQuantity = itemPriceRange[0] + "-" + itemPriceRange[itemPriceRange.length-1] ;
                        var something;
                    }
                }


            }
        }
    }

    return service;
}
