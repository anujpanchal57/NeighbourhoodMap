// Contains locations of various places on the map
var markPlaces = [{
        name: 'Hotel Marine Plaza',
        loc: {
            lat: 18.931191,
            lng: 72.823173
        },
    },
    {
        name: 'Trident Hotel',
        loc: {
            lat: 18.9279443,
            lng: 72.8210286
        },
    },
    {
        name: 'The Oberoi',
        loc: {
            lat: 18.926975,
            lng: 72.8204516
        },
    },
    {
        name: 'NCPA',
        loc: {
            lat: 18.9257526,
            lng: 72.8190792
        },
    },
    {
        name: 'Starbucks',
        loc: {
            lat: 18.9275348,
            lng: 72.8220548
        },
    },
    {
        name: 'InterContinental',
        loc: {
            lat: 18.9350216,
            lng: 72.8242804
        },
    },
    {
        name: 'Bombay High Court',
        loc: {
            lat: 18.930523,
            lng: 72.8305364
        },
    }
];
// This function helps in creating the locations
function Location(data) {
    var self = this;
    self.name = ko.observable(data.name);
    self.location = ko.observable(data.location);
}

// For the sake of Maps API
var map;

var markers = [];

// Generate an error when the Map does not load properly
function googleError() {
    document.getElementById('map').innerHTML = "Map is not able to load";
}

function myMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 18.93,
            lng: 72.83
        },
        zoom: 14,
    });

    var largeInfowindow = new google.maps.InfoWindow();

    // Creates an array of markers for the markPlaces array to initialize on
    var makeMarkers = function() {

        // Gets position and title from the markPlaces[]
        var position = markPlaces[i].loc;
        var title = markPlaces[i].name;

        // Creates a marker for each location
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
        });

        // Pushes the marker to an array of markers
        markers.push(marker);

        // Creates an onclick window when we click on the marker
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);

        });
    };

    for (var i = 0; i < markPlaces.length; i++) {
        makeMarkers(markPlaces[i]);
    }

    // This function helps to pop up the InfoWindow as soon as the marker is clicked.
    // Only one InfoWindow per marker will open when the marker will be clicked.
    function populateInfoWindow(marker, infowindow) {

        // Checks whether the InfoWindow is not open on this marker
        if (infowindow.marker != marker) {

            infowindow.marker = marker;

            // For FourSquare Ajax
            // Indicates the URL for FOURSQUARE API
            var fourSquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + marker.position.lat() + ',' + marker.position.lng() + '&query=' + marker.title + '&client_id=KMVDTL5KKDEAU4BXIOBKNDJCAL1BLSY0NYGB2L5REIROXI5Y&client_secret=EYCURRGW4JJXYDUXQK41HITICT30MJ3JOXNE4CFC25Q10DCV&v=20170628';

            var fourSquareRequestTimeOut = setTimeout(function() {
                infowindow.setContent('<div>' + marker.title + '</div>' + '<div>Failed to get a response from FourSquare</div>');
                toggleBounce(marker);
                infowindow.open(map, marker);
            }, 4000);

            $.ajax({
                url: fourSquareURL,
                dataType: 'jsonp',
                success: function(response) {
                    var firstResult = response.response.venues[0] || "";

                    var phoneNo = firstResult.contact.formattedPhone;
                    if (phoneNo === undefined) {
                        phoneNo = "Not available on FourSquare";
                    }

                    var url = firstResult.url;
                    if (url === undefined) {
                        url = "Not available on FourSquare";
                    }

                    infowindow.setContent('<div>' + marker.title + '</div>' + '<div>Contact details from FourSquare:</div>' + '<div>Phone: ' + phoneNo + '</div>' + '<div>Website: ' + '<a href="' + url + '">' + url + '</a>' + '</div>');

                    toggleBounce(marker);
                    infowindow.open(map, marker);

                    clearTimeout(fourSquareRequestTimeOut);
                }
            });

            // Helps to assure that marker prop is cleared if and only if the InfoWindow is closed
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
                marker.setAnimation(null);
            });
        }
    }

    // This Function helps the markers to give some animation (In this case, it is DROP)
    function toggleBounce(marker) {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.DROP);

            // Set the timeout on DROP so that the marker DROPS only once when clicked
            setTimeout(function() {
                marker.setAnimation(null);
            }, 700);
        }
    }
}

// Created a new variable ViewModel for the sake of displaying the markers visually
var ViewModel = function() {

    var self = this;

    // Creates an array[] for storing the locations
    self.locationList = ko.observableArray([]);
    self.query = ko.observable('');

    // Helps to push each location in the locationList[]
    markPlaces.forEach(function(item) {
        self.locationList.push(new Location(item));
    });

    // Indicates the current location onclick
    self.currentLocation = ko.observable(self.locationList()[0]);

    self.setLocation = function(clickedLocation) {
        self.currentLocation(clickedLocation);
        console.log(clickedLocation.name());
        for (var i = 0; i < markers.length; i++) {
            if (clickedLocation.name() == markers[i].title) {
                google.maps.event.trigger(markers[i], 'click');
            }
        }
    };

    // Passes the locations and markers which are displayed from the input box
    self.searchResults = ko.computed(function() {
        var filter = self.query().toLowerCase();

        // For Filter Markers
        for (var i = 0; i < self.locationList().length; i++) {
            if (self.locationList()[i].name().toLowerCase().indexOf(filter) > -1) {
                for (var j = 0; j < markers.length; j++) {
                    if (self.locationList()[i].name() == markers[j].title) {
                        markers[j].setVisible(true);
                    }
                }
            } else {
                for (var k = 0; k < markers.length; k++) {
                    if (self.locationList()[i].name() == markers[k].title) {
                        markers[k].setVisible(false);
                    }
                }
            }
        }

        // Filter List
        if (!filter) {
            return self.locationList();
        } else {
            return ko.utils.arrayFilter(self.locationList(), function(item) {
                return item.name().toLowerCase().indexOf(filter) > -1;
            });
        }
    });
};

ko.applyBindings(new ViewModel());
