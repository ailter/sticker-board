stickerApp.controller('mainController', ['$scope', '$location', '$compile', '$http', '$q',
  function($scope, $location, $compile, $http, $q) {
	var canceller = $q.defer();
	$scope.mapCurrentZoom = -99;
	$scope.activeStickers = [];
	$scope.guid = function() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		};
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	};
	
	$scope.user = {
		"name": "Test User"
	};

	$scope.convertCharCode = function (str) {
        return str.replace(/\İ/g, '&#304;').replace(/\ı/g, '&#305;').replace(/\Ö/g, '&#214;').replace(/\ö/g, '&#246;').replace(/\Ü/g, '&#220;').replace(/\ü/g, '&#252;').replace(/\Ç/g, '&#199;').replace(/\ç/g, '&#231;').replace(/\Ğ/g, '&#286;').replace(/\ğ/g, '&#287;').replace(/\Ş/g, '&#350;').replace(/\ş/g, '&#351;').replace(/\₤/g, '&#8356;');
    };

	$scope.initPage = function() {
		$scope.categories = [
		    { "id": 1, "label": "Todo", "class": "panel panel-primary" },
		    { "id": 2, "label": "In Progress", "class": "panel panel-info" },
		    { "id": 3, "label": "Done", "class": "panel panel-success" },
		    { "id": 4, "label": "Expired", "class": "panel panel-danger" }
	    ];
		
		if(sessionStorage.getItem('activeStickers') != null) {
			$scope.activeStickers = JSON.parse(sessionStorage.getItem('activeStickers'));
			for (var i = 0; i < $scope.activeStickers.length; i++) {
				$scope.setPinOnMap($scope.activeStickers[i]);
			}
		}
	};
	
	$scope.setMsg = function(title, content) {
		$('#msgTitle').text(title);
		$('#msgContent').text(content);
		$('#msgModal').modal('show');
	};
	
	$scope.clearMsg = function() {
		$('#msgTitle').text('');
		$('#msgContent').text('');
	};
	
	$scope.stickerMaximumCharacterCount = 300;
	
	$scope.checkForm = function() {
		var err = true;
		if($scope.txtSticker == '' || $scope.txtSticker == null) {
			$scope.setMsg('Warning', 'Sticker content is empty.');
			err = false;
		}
		else if ($scope.txtSticker.length > $scope.stickerMaximumCharacterCount) {
			$scope.setMsg('Warning', 'Sticker content length cannot be more than ' + $scope.stickerMaximumCharacterCount + ' characters.');
			err = false;
		}
		else if ($scope.txtPerson == '' || $scope.txtPerson == null) {
			$scope.setMsg('Warning', 'Person is empty.');
			err = false;
		}
		else if($scope.txtCategory == null || $scope.txtCategory == undefined){
			$scope.setMsg('Warning', 'Category is empty');
			err = false;
		}
		
		return err;
	};
	
	$scope.beginUpdate = function(id, person, content, cid, rwcid, ipn) {
		$('#divShowCreator').css('display', 'none');
		content = content.replace(/#tirnak#/g,"'");
		content = content.replace(/#cifttirnak#/g,"\"");
		stickerToUpdate = {};
		for (var i = 0; i < $scope.activeStickers.length; i++) {
			if ($scope.activeStickers[i].id == id) {
				
				$scope.activeStickers[i].text = content;
				$scope.activeStickers[i].ipn = ipn;
				$scope.activeStickers[i].person = person;
				for (var j = 0; j < $scope.categories.length; j++) {
					if ($scope.categories[j].id == cid) {
						$scope.activeStickers[i].category = $scope.categories[j];
						break;
					}
				}
				
				for (var x = 0; x < $scope.rwCategories.length; x++) {
					if ($scope.rwCategories[x].id == rwcid) {
						$scope.activeStickers[i].rwCategory = $scope.rwCategories[x];
						break;
					}
				}
				
				stickerToUpdate = $scope.activeStickers[i];
				break;
			}
		}
		
		$('#txtPerson').val(stickerToUpdate.person);
		$('#txtSticker').val(stickerToUpdate.text);
		$('#txtCategory').val(stickerToUpdate.category.id);
		$('#txtRWKategori').val(stickerToUpdate.rwCategory.id);
		$('#addStickerModal').modal('show');
	};
	
	$('#addStickerModal').on('hidden.bs.modal', function () {
		$('#divShowCreator').css('display', 'block');
		$('#txtSticker').val('');
		$('#txtPerson').val('');
		$('#txtCategory').val('-1');
		$('#txtRWKategori').val('-1');
		$('#txtShowCreator').attr('checked', true);
	});
	
	$scope.stickerGuncelle = function() {
		if($scope.checkForm()) {
			
			if ($scope.user.ipn == stickerToUpdate.ipn) {
				$scope.setMsg('Uyarı', 'Kendinize post-it yazamazsınız.');
				return;
			}
			
		    $.post("UpdateSticker",
		    {
		        "categoryId": $('#txtCategory').val(),
		        "rwCategoryId": $('#txtRWKategori').val(),
		        "id": stickerToUpdate.id,
		        "text": $('#txtSticker').val().replace(/'/g, "\'"),
		        "ipn": stickerToUpdate.ipn
		    },
		    function(data, status){
		    	if(data == '1') {
		    		stickerToUpdate.text = $('#txtSticker').val().replace(/'/g, "\'");
		    		stickerToUpdate.person = $('#txtPerson').val();
		    		//$scope.setPinOnMap();
					$('#addStickerModal').modal('hide');
					
					$scope.updateOnMap();
					$scope.clearForm();
					
					stickerToUpdate = null;
					//evt = null;
		    	}
		    	else {
		    		stickerToUpdate = null;
		    		$('#addStickerModal').modal('hide');
					$scope.setMsg("Uyarı", "İşlem yapılırken bir hata oluştu, lütfen tekrar deneyin.");
				}
		    	$('#divShowCreator').css('display', 'none');
		    });
		}
		else {
			stickerToUpdate = null;
			$('#addStickerModal').modal('hide');
			$('#divShowCreator').css('display', 'block');
		}
	};
	
	$scope.activeCategory = null;
	
	$scope.saveSticker = function() {
		if (stickerToUpdate == null) {
			newElementId = $scope.guid();
			
			if($scope.checkForm()) {
	    		$scope.setPinOnMap();
				$scope.clearForm();
				$('#addStickerModal').modal('hide');
			}
		}
		else {
			$scope.stickerGuncelle();
		}
	};
	
	$scope.clearForm = function() {
		$('#txtSticker').val('');
		$('#txtPerson').val('');
		$('#txtCategory').val('-1');
	};
	
	var marker = null;
	
	$scope.getSelectedCategory = function() {
		for (var i = 0; i < $scope.categories.length; i++) {
			if (parseInt($scope.categories[i].id) == parseInt($('#txtCategory').val())) {
				return $scope.categories[i];
			}
		}
		
		return null;
	};
	
	$scope.widthCoeff = 113;
	$scope.fixedWidth = '170px';
	$scope.imgWidthCoeff = 29;
	$scope.fixedImageWidth = '90px';
	$scope.paddingLeftCoeff = 0.35;
	var newElementId = '';
	$scope.openStickerDetailModal = function(id) {
		var activeSticker = null;
		for (var i = 0; i < $scope.activeStickers.length; i++) {
			if ($scope.activeStickers[i].id == id) {
				activeSticker = $scope.activeStickers[i];
				break;
			}
		}
		
		document.getElementById('panelClass').setAttribute('class', activeSticker.category.class);
		document.getElementById('panelHeaderText').innerHTML = activeSticker.category.label;
		var panelImgWrapper = document.getElementById('panelImg');
		panelImgWrapper.innerHTML = '';
		var panelImg = document.createElement('img');
		panelImgWrapper.appendChild(panelImg);
		panelImg.setAttribute('src', activeSticker.rwCategory.img);
		document.getElementById('panelPerson').innerHTML = activeSticker.personel.ad + ' ' + activeSticker.personel.soyad;
		document.getElementById('panelText').innerHTML = activeSticker.text.replace(/#tirnak#/g, '\'').replace(/#cifttirnak#/g, '"');
		document.getElementById('panelText').style.padding = '5%';
		if (activeSticker.showCreator == "1") {
			document.getElementById('detailShowCreator').innerHTML = activeSticker.creatorName + ' ' + activeSticker.creatorSurname;
		}
		else {
			document.getElementById('detailShowCreator').innerHTML = '';
		}
		$('#stickerDetailModal').modal('show');
	};
	
	$scope.checkMapZoom = function() {
		return $scope.mapCurrentZoom > 3.9;
	};
	var stickerToDelete = '0';
	var stickerToUpdate = null;
	$scope.deleteSticker = function(id, stat) {
		if (!stat) {
			stickerToDelete = id;
			$('#verifyModal').modal('show');
		}
		else {
			$('#verifyModal').modal('hide');
			for (var i = $scope.activeStickers.length - 1; i >= 0; i--) {
				if ($scope.activeStickers[i].id == stickerToDelete) {
					$scope.activeStickers.splice(i, 1);
					break;
				}
			}
			
			var elementToRemove = document.getElementById(stickerToDelete);
			elementToRemove.parentNode.removeChild(elementToRemove);
			sessionStorage.setItem('activeStickers', JSON.stringify($scope.activeStickers));
		}
	};
	
	$scope.updateRWCountOnMap = function(category, val) {
		var countHeaderElement = document.getElementById('count_' + category);
		var countSpanElement = countHeaderElement.childNodes[0];
		var currentCount = countSpanElement.innerHTML;
		currentCount = parseInt(currentCount) + val;
		countSpanElement.textContent = currentCount;
	};
	
	$scope.openUserManagementModal = function() {
		$('#userManagementModal').modal('show');
	};
	
	$scope.authorizeUser = function(ipn, stat) {
		 $http({
	            url: 'AuthorizeUser',
	            method: "POST",
	            data: $.param({ 'ipn': ipn, 
	            				'stat': stat 
	            				}),
	            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
	            timeout: canceller.promise
	        })
	        .then(function (response) {
	        	if (response.data == "1") {
					for (var i = 0; i < $scope.userList.length; i++) {
						if ($scope.userList[i].ipn == ipn) {
							$scope.userList[i].isAuthorized = stat;
							break;
						}
					}
				}
	        	else {
					$scope.setMsg("Uyarı", "İşlem yapılırken bir hata oluştu.");
				}
	        },
	        function (response) {
	        	console.error(response);
	        	$scope.setMsg("Uyarı", "İşlem yapılırken bir hata oluştu.");
	        });
	};
	
	$scope.searchUsers = function(){
		$scope.toggleSearchIcon(1);
		if ($scope.txtAd === undefined && $scope.txtSoyad === undefined) {
			$scope.setMsg("Uyarı", "Lütfen ad veya soyad alanlarından en az birini doldurunuz.");
		}
		else {
			if ($scope.txtAd === undefined) 
				$scope.txtAd = '';
			if ($scope.txtSoyad === undefined)
				$scope.txtSoyad = '';
			
			 $http({
		            url: 'SearchUsers',
		            method: "POST",
		            data: $.param({ 'ad': $scope.convertCharCode($scope.txtAd), 
		            				'soyad': $scope.convertCharCode($scope.txtSoyad) 
		            				}),
		            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		            timeout: canceller.promise
		        })
		        .then(function (response) {
		        	$scope.userList = response.data.userList;
		        	$scope.toggleSearchIcon();
		        },
		        function (response) {
		        	$scope.toggleSearchIcon();
		        });
			
		};
	};
	
	$scope.moveSticker = function(st) {
		$scope.setPinOnMap(st);
	};
	
	$scope.moving = false;
	$scope.movingItemId = null;
	$scope.startMove = function(id) {
		$('#move_'+id).css('display', 'block');
		$scope.moving = true;
		$scope.movingItemId = id;
	};
	
	$scope.searchPersonelForReport = false;
	
	$scope.openKisiModal = function(search) {
		$scope.searchPersonelForReport = false;
		$scope.userList = [];
		$scope.txtAd = '';
		$scope.txtSoyad = '';
		if(search) $scope.searchPersonelForReport = true;
		$('#tagUserModal').modal('show');
	};
	
	$scope.updateOnMap = function() {
	
		var category = $scope.getSelectedCategory();
		var rwCategory = $scope.getSelectedRWCategory();
		
		var panelElement = document.getElementById('outer_' + stickerToUpdate.id);
		panelElement.setAttribute("class", category.class);
		
		var panelHeaderElement = document.getElementById('head_' + stickerToUpdate.id);
		panelHeaderElement.innerHTML = category.label;
		
		var panelImgElement = document.getElementById("img_"+stickerToUpdate.id);
		panelImgElement.setAttribute("src", rwCategory.img);
	
		var panelBodyElement = document.getElementById('body_' + stickerToUpdate.id);
		panelBodyElement.innerHTML = stickerToUpdate.text.trim();
		
	    var panelActionsEditElement = document.getElementById("up_" + stickerToUpdate.id);
	    var updateButton = angular.element('<button class="btn btn-default btn-block" ng-click="beginUpdate(\'' 
				  + stickerToUpdate.id + '\', \'' + stickerToUpdate.person + '\', \''
				  + stickerToUpdate.text.replace(/'/g, "#tirnak#").replace(/"/g, "#cifttirnak#") +'\', '+category.id+','+rwCategory.id +', \'' + stickerToUpdate.ipn + '\''
				  + ')"><span class="glyphicon glyphicon-edit"></span></button>');
	    panelActionsEditElement.innerHTML = '';
	    var temp = $compile(updateButton)($scope);
	    angular.element(panelActionsEditElement).append(temp);
	    
	    var panelKisiElement = document.getElementById('kisi_'+stickerToUpdate.id);
	    panelKisiElement.innerHTML = stickerToUpdate.person;
	    
	    var panelCreatorElement = document.getElementById('creator_' + stickerToUpdate.id);
	    if (!$('#txtShowCreator').is(':checked')) {
			panelCreatorElement.innerHTML = '';
		}
	    else {
	    	
	    }
	};
	
	function showDetail(param) {
		var stickerElementId = param.srcElement.id;
		stickerElementId = stickerElementId.substring(stickerElementId.lastIndexOf('_')+1, stickerElementId.length);
		$scope.openStickerDetailModal(stickerElementId);
	}
	
	window.my_scope = $scope;
	
	$scope.filterAllItems = function() {
		for (var i = 0; i < $scope.activeStickers.length; i++) {
			$scope.activeStickers[i].active = "1";
			if (!document.getElementById($scope.activeStickers[i].id)) {
				$scope.setPinOnMap($scope.activeStickers[i]);
			}
		}
		
		var tumuMenuItem = document.getElementById('allItems');
		var myItemsMenuItem = document.getElementById('myItems');
		var myFeedbacksMenuItem = document.getElementById('myFeedbacks');
		
		tumuMenuItem.setAttribute('class', 'glyphicon glyphicon-check');
		myItemsMenuItem.setAttribute('class', 'glyphicon glyphicon-unchecked');
		myFeedbacksMenuItem.setAttribute('class', 'glyphicon glyphicon-unchecked');
	};
	
	$scope.filterMyFeedbacks = function() {
		
		for (var i = 0; i < $scope.activeStickers.length; i++) {
			if ($scope.activeStickers[i].personel.ipn === $scope.user.ipn) {
				$scope.activeStickers[i].active = "1";
				if (!document.getElementById($scope.activeStickers[i].id)) {
					$scope.setPinOnMap($scope.activeStickers[i]);
				}
			}
			else {
				$scope.activeStickers[i].active = "0";
				if (document.getElementById($scope.activeStickers[i].id)){
					var elementToRemove = document.getElementById($scope.activeStickers[i].id).parentNode;
					elementToRemove.parentNode.removeChild(elementToRemove);
				}
			}
		}
		
		var tumuMenuItem = document.getElementById('allItems');
		var myItemsMenuItem = document.getElementById('myItems');
		var myFeedbacksMenuItem = document.getElementById('myFeedbacks');
		
		tumuMenuItem.setAttribute('class', 'glyphicon glyphicon-unchecked');
		myItemsMenuItem.setAttribute('class', 'glyphicon glyphicon-unchecked');
		myFeedbacksMenuItem.setAttribute('class', 'glyphicon glyphicon-check');
	};
	
	$scope.filterMyItems = function() {
		
		for (var i = 0; i < $scope.activeStickers.length; i++) {
			if ($scope.activeStickers[i].creator === $scope.user.ipn) {
				$scope.activeStickers[i].active = "1";
				if (!document.getElementById($scope.activeStickers[i].id)) {
					$scope.setPinOnMap($scope.activeStickers[i]);
				}
			}
			else {
				$scope.activeStickers[i].active = "0";
				if (document.getElementById($scope.activeStickers[i].id)) {
					var elementToRemove = document.getElementById($scope.activeStickers[i].id).parentNode;
					elementToRemove.parentNode.removeChild(elementToRemove);	
				}
			}
		}
		
		var tumuMenuItem = document.getElementById('allItems');
		var myItemsMenuItem = document.getElementById('myItems');
		var myFeedbacksMenuItem = document.getElementById('myFeedbacks');
		
		tumuMenuItem.setAttribute('class', 'glyphicon glyphicon-unchecked');
		myItemsMenuItem.setAttribute('class', 'glyphicon glyphicon-check');
		myFeedbacksMenuItem.setAttribute('class', 'glyphicon glyphicon-unchecked');
		
	};
	
	$scope.createElement = function(st) {
		var category = null;
		var person = '';
		var content = '';
		
		if (st) {
			newElementId = st.id;
			if (st.category != null)
				category = st.category;
			else {
				category = $scope.txtCategory;
			}
		
			person = st.person;
			content = st.text;
			dateOfCreation = $scope.fixDateTime(st.dateOfCreation);
		}
		else {
			category = $scope.txtCategory;
			person = $scope.txtPerson;
			content = $scope.txtSticker;
			dateOfCreation = $scope.fixDateTime();
		}
		
		content = content.replace(/#cifttirnak#/g, '"');
		
	    var stickerElement = document.createElement('div');
	    stickerElement.setAttribute('id', newElementId);
	    stickerElement.style.zIndex = '1';
	    
	    var panelElement = document.createElement('div');
	    panelElement.setAttribute('class', category.class);
	    panelElement.setAttribute('id', 'outer_'+newElementId);
	    panelElement.style.maxWidth = $scope.fixedWidth;
	    panelElement.style.width = $scope.fixedWidth;
	    
	    var panelHeaderElement = document.createElement('div');
	    panelHeaderElement.setAttribute("class", "panel-heading");
	    panelHeaderElement.setAttribute("id", "panelHead_"+newElementId);
	    panelHeaderElement.style.cursor = 'pointer';
	    
	    if (stickerElement.addEventListener) {
	    	panelHeaderElement.addEventListener('click', showDetail, false);
		}
	    else {
	    	stickerElement.attachEvent('click', showDetail);
		}
	    
	    var panelHeaderTextElement = document.createElement("b");
	    panelHeaderTextElement.setAttribute("id", "head_"+newElementId);
	    panelHeaderTextElement.innerHTML = category.label;
	    panelHeaderElement.appendChild(panelHeaderTextElement);
	    
	    var panelBodyElement = document.createElement('div');
	    panelBodyElement.setAttribute("class", "panel-footer");
	    panelBodyElement.setAttribute("id", "content_"+newElementId);
	    panelBodyElement.style.fontFamily = 'Bookman Old Style !important';
	    
	    var panelBodyRowElement = document.createElement('div');
	    panelBodyRowElement.setAttribute("class", "row");
	    
	    panelBodyColElement = document.createElement('div');
	    panelBodyColElement.setAttribute("class", "col-xs-12");
	    panelBodyColElement.setAttribute("id", "body_"+newElementId);
	    panelBodyColElement.innerHTML = content;
	    panelBodyRowElement.appendChild(panelBodyColElement);
	    panelBodyElement.appendChild(panelBodyRowElement);
	    
	    var panelPersonElement = document.createElement('div');
	    panelPersonElement.style.fontSize = '11px';
	    panelPersonElement.style.fontWeight = 'bold';
	    panelPersonElement.setAttribute("class", "panel-body");
	    panelPersonElement.setAttribute("id", "kisi_"+newElementId);
	    panelPersonElement.innerHTML = person.trim();
	    
	    var panelActionsWrapElement = document.createElement('div');
	    panelActionsWrapElement.setAttribute("class", "row");
	    panelActionsWrapElement.setAttribute("id", "action_"+newElementId);
	    
	    var panelActionsDeleteElement = document.createElement('div');
	    panelActionsDeleteElement.setAttribute('class', 'col-xs-6');
	    
	    var deleteButton = angular.element('<button class="btn btn-default btn-block" ng-click="deleteSticker(\''+newElementId+'\')"><span class="glyphicon glyphicon-trash"></span></button>');
	    temp = $compile(deleteButton)($scope);
	    angular.element(panelActionsDeleteElement).append(temp);
	    
	    var panelActionsMoveElement = document.createElement('div');
	    panelActionsMoveElement.setAttribute('class', 'col-xs-6');
	    
	    var moveButton = angular.element('<button title="Move" class="btn btn-default btn-block" ng-click="startMove(\''+newElementId+'\')"><span class="glyphicon glyphicon-move"></span></button>');
	    temp = $compile(moveButton)($scope);
	    angular.element(panelActionsMoveElement).append(temp);
	    
	    panelActionsWrapElement.appendChild(panelActionsDeleteElement);
	    panelActionsWrapElement.appendChild(panelActionsMoveElement);
	    
	    var panelActionsTextElement = angular.element('<div class="row" id="move_'+ newElementId + '" style="display: none; text-align: center;"><div class="col-xs-12"><span style="font-size: 10px; font-weight:bold; color: red;"><i>Click any spot for new location.</i></span></div></div>');
	    temp = $compile(panelActionsTextElement)($scope);
	    
	    panelElement.appendChild(panelHeaderElement);
	    panelElement.appendChild(panelPersonElement);
	    panelElement.appendChild(panelBodyElement);
	    panelElement.appendChild(panelActionsWrapElement);
	    
	    angular.element(panelElement).append(temp);
	    stickerElement.appendChild(panelElement);
	    
	    
	    if (!st) {
	    	var newSticker = {
	        		"id": newElementId,
	        		"person": $scope.txtPerson,
	        		"text": $scope.txtSticker,
	        		"latitude": evt.coordinate[1],
	        		"longitude": evt.coordinate[0],
	        		"creator": $scope.user,
	        		"dateOfCreation": $scope.getCurrentDate(),
	        		"category": category
	        };
	        $scope.activeStickers.push(newSticker);
		}
	    sessionStorage.setItem('activeStickers', JSON.stringify($scope.activeStickers));
	    return stickerElement;
	};
	
	function mouseOverSticker(e) {
		$scope.mouseOverSticker(e);
	}
	
	$scope.logout = function() {
		$scope.user = null;
		window.location.href = 'login.jsp';
	};
	
	$scope.getCurrentDate = function() {
		var curDate = new Date();
		return curDate.getFullYear() + '-' + parseInt(curDate.getMonth()+1) + '-' + curDate.getDate();
	};
	
	$scope.fixText = function(val) {
		return val.replace(/<br\/>/g, '')
				  .replace(/#cifttirnak#/g, '"')
				  .replace(/#tirnak#/g, '\'');
	};
	
	$scope.fixDateTime = function(val) {
		var day, month, year, hour, minute;
		if (val) {
			var parts = val.split(' ');
			var datePart = parts[0].split('-');
			var timePart = '00';
			if(parts[1])
				timePart = parts[1].substring(0, 5);
			
			day = datePart[2];
			month = datePart[1];
			year = datePart[0];
			
			hour = timePart.substring(0, 2);
			minute = timePart.substring(3, 5);
			
		}
		else {
			var date = new Date();
			day = date.getDate();
			month = parseInt(date.getMonth()) + 1;
			year = date.getFullYear();
			
			hour = date.getHours();
			minute = date.getMinutes();
		}
		
		hour = parseInt(hour) < 10 ? '0' + parseInt(hour) : hour;
		minute = ( parseInt(minute) < 10 && parseInt(minute) > 0 ) ? '0' + parseInt(minute) : minute;
		return day + '/' + month + '/' + year + ' ' + hour + ':' + minute;
	};
	
	$scope.currentPointerPosition = null;
	
	$scope.setRWCountOnMap = function(category) {
		var element = document.createElement('h1');
		var coor = [];
		coor.push(category.latitude);
		coor.push(category.longitude);
		element.setAttribute('id', 'count_' + category.id);
		
		var labelElement = document.createElement('span');
		labelElement.setAttribute('class', 'label label-default');
		labelElement.textContent = category.count;
		element.appendChild(labelElement);
		
		var rwMarker = new ol.Overlay({
			position: coor,
			positioning: 'top-left',
			element: element,
			stopEvent: true,
			scale: 0.2
		});
		
		$scope.map.addOverlay(rwMarker);
	};
	
	$scope.setPinOnMap = function(st){
		var coors = [];
		if ((st != undefined && evt == null) || (st != undefined && evt != null)) {
			coors.push(st.longitude);
			coors.push(st.latitude);
		}
		else {
			coors = evt.coordinate;
		}
	
	    marker = new ol.Overlay({
	        position: coors,
	        positioning: 'top-left',
	        element: $scope.createElement(st),
	        stopEvent: true,
	        scale: 0.2
	      });
	    
	    $scope.map.addOverlay(marker);
	};
	
//	var mapExtent = [0.00000000, -500.00000000, 100.00000000, -500.00000000];
//	var mapMinZoom = 0;
//	var mapMaxZoom = 2;
//	var mapMaxResolution = 1.00000000;
//	var tileExtent = [0.00000000, -700.00000000, 1000.00000000, -200.00000000];
	
	var mapExtent = [0.00000000, -280.00000000, 700.00000000, -220.00000000];
	var mapMinZoom = 0;
	var mapMaxZoom = 2;
	var mapMaxResolution = 1.00000000;
	var tileExtent = [0.00000000, -480.00000000, 700.00000000, 0.00000000];
	
	var evt = null;
	
	var mapResolutions = [];

	if ($location.absUrl().indexOf('login') == -1) {
		for (var z = 0; z <= mapMaxZoom; z++) {
			  mapResolutions.push(Math.pow(2, mapMaxZoom - z) * mapMaxResolution);
			}
			
			var mapTileGrid = new ol.tilegrid.TileGrid({
			  extent: tileExtent,
			  minZoom: mapMinZoom,
			  resolutions: mapResolutions
			});
			
			var layer = new ol.layer.Tile({
			  source: new ol.source.XYZ({
			    attributions: [new ol.Attribution({html: 'BOOMERANG'})],
			    projection: 'PIXELS',
			    tileGrid: mapTileGrid,
			    url: "{z}/{x}/{y}.png",
			  })
			});
			
			var mousePositionControl = new ol.control.MousePosition({
		        coordinateFormat: ol.coordinate.createStringXY(4),
		        className: 'custom-mouse-position',
		        target: document.getElementById('mouse-position'),
		        undefinedHTML: '&nbsp;'
		      });
			$scope.map = new ol.Map({
			 controls: ol.control.defaults({
		          attributionOptions: {
		            collapsible: false
		          }
		        }).extend([mousePositionControl]),
			  target: 'map',
			  layers: [
			    layer
			  ],
			  view: new ol.View({
			    projection: ol.proj.get('PIXELS'),
			    extent: mapExtent,
			    maxResolution: mapTileGrid.getResolution(mapMinZoom)
			  })
			});
			
			$scope.map.on('click', function(event) {
				evt = event;
				if ($scope.moving) {
					
					var sticker = null;
					for (var i = $scope.activeStickers.length - 1; i >= 0; i--) {
						if ($scope.activeStickers[i].id == $scope.movingItemId) {
							sticker = $scope.activeStickers[i];
							$scope.activeStickers.splice(i, 1);
							break;
						}
					}
					var newPosition = document.getElementById('mouse-position').children[0].innerHTML.split(', ');
					sticker.longitude = newPosition[0];
					sticker.latitude = newPosition[1];
					newElementId = $scope.movingItemId;
					$scope.activeStickers.push(sticker);
					//$('#move_' + $scope.movingItemId).css('display', 'none');
					document.getElementById('move_' + $scope.movingItemId).style.display = 'none';
					var elementToRemove = document.getElementById($scope.movingItemId);
					elementToRemove.parentNode.removeChild(elementToRemove);
					$scope.moveSticker(sticker);
					$scope.movingItemId = null;
					$scope.moving = false;
				}
				else {
					$('#addStickerModal').modal('show');
				}
			});
			
			$scope.openStickerReportModal = function(){
				$('#stickerReportModal').modal('show');
			};	
			
			$scope.map.on('moveend', function(event) {
//				var user = JSON.parse(sessionStorage.getItem('user'));
				var user;
				if ($scope.user == null) {
					return;
				}
				else {
					user = $scope.user;
				}
				if (!$scope.activeStickers) {
					return;
				}
				$scope.mapCurrentZoom = $scope.map.getView().getZoom();
				
				for (var i = 0; i < $scope.activeStickers.length; i++) {
					document.getElementById('outer_'+$scope.activeStickers[i].id).style.maxWidth = $scope.fixedWidth;
					document.getElementById('content_'+$scope.activeStickers[i].id).style.display = 'block';
					document.getElementById('kisi_'+$scope.activeStickers[i].id).style.display = 'block';
					document.getElementById('action_'+$scope.activeStickers[i].id).style.display = 'block';
					document.getElementById('head_'+$scope.activeStickers[i].id).style.display = 'block';
					document.getElementById('outer_'+$scope.activeStickers[i].id).style.width = $scope.fixedWidth;
				}
			});
		
		$scope.map.getView().fit(mapExtent, $scope.map.getSize());
		$scope.initPage();	
	}
}]);
