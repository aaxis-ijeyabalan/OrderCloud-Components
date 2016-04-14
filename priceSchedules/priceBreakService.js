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

            if(priceSchedule.PriceBreaks[i].Quantity == maxQuantity ) {
                priceSchedule.PriceBreaks[i].displayQuantity= priceSchedule.PriceBreaks[i].Quantity + "+";
            }else{
                var itemPriceRange = Underscore.range(priceSchedule.PriceBreaks[i].Quantity,priceSchedule.PriceBreaks[i + 1].Quantity);
                itemPriceRange;
                if(itemPriceRange[itemPriceRange.length-1] - itemPriceRange[0] <= 1){
                    priceSchedule.PriceBreaks[i].displayQuantity = itemPriceRange[0];
                }else{
                    priceSchedule.PriceBreaks[i].displayQuantity = itemPriceRange[0] + "-" + itemPriceRange[itemPriceRange.length-1] ;
                }
            }
        }
    }


    return service;
}
