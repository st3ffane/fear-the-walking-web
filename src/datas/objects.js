/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  
objects.js: pour permettre le binding d'objet

surcharge defineProperty: c'est appellé a etre modifier dans une future version
*/



Object._defineProperty = Object.defineProperty;
Object.defineProperty = function (cible, name, accessors){
        //doit modifier le setter pour y mettre le notify...
        
        if (accessors.set){
                setters = { get: function(){ return accessors.get.call(this)},
                    set: function(v){
                            
                            
                            accessors.set.call(this,v);
                            //met a jour les bindings....
				//passe l'UUID de l'objet pour retrouver avec la cl?
				//note, context itou?
				//notifyDatasetChanged(this.__uuid__+":"+obj_k);
                                
                                if (this.__uuid__){
                                        var key = this.__uuid__+":"+name;
                                        var bindings = BINDINGS;
                                        if (key in bindings) {
                                                __notifyDatasetChanged(this,bindings[key], key);
                                        }
                                }
                                
				
                        }
                };
                Object._defineProperty(cible, name, setters);
        }
        else {
                
                Object._defineProperty(cible, name, accessors);
        }
        
}

//permet de creer le necessaire pour la liaison de donnée  (ie: property et notify)
//@param obj: le plain object javascript a rendre 'bindable'
var defineBindObject = function(obj){
    if (obj == null) return;
    var is_array = false;

    if (obj.hasOwnProperty('__uuid__') !== true){
        if (Array.isArray(obj) && ""+Object.prototype.toString.call(obj)!="[object String]"){
            is_array = true;
        }

        else if (""+Object.prototype.toString.call(obj)!="[object Object]") {

    		return;//deja fait
    	}
    } else return;


	//cree la property de marquage
	var uuid = generateUUID();

	Object.defineProperty(obj, '__uuid__',{value:uuid , enumerable: false, writable:false});//????? avec le in, pe un probleme?
	Object.defineProperty(obj, 'notifyDatasetChanged',{value: function(name, extra){
		
				//passe l'UUID de l'objet pour retrouver avec la cl?
				//note, context itou?
				//notifyDatasetChanged(this.__uuid__+":"+obj_k);
				var key = this.__uuid__+":"+name;
                                //("search for "+key);
				if (key in BINDINGS) {
					////("OK");
                                        //("notify from setter");
					__notifyDatasetChanged(this,BINDINGS[key], key, extra);
				}
	}, enumerable: false, writable:false});
	//defini des  owners pour l'objet EXPERIMENTAL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	Object.defineProperty(obj, "__owners__",{value:[], enumerable:false, modifiable:true});
	//ajoute, supprime un owners
	obj.AddToOwners = function(owner, prop_name){
		this.__owners__.push( [owner, prop_name]);//ajoute a la liste
	};
	obj.RemoveFormOwners = function(owner, prop_name){
		if (this.__owners__){
                        var owi = this.__owners__.length;
                        while(owi--){
			//for (owi=0;owi<this.__owners__.length; owi++){
				var ow = this.__owners__[owi];
				if (ow[0] == owner && ow[1]==prop_name){
					this.__owners__.slice(owi,1);//supprime
					break;//fini
				}
			}
		}
	};

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    //si array, binde de facon particuliere
    if (is_array){
        //("ArrayBinding data: particulier");
        obj.__proto__ = DBArray;//change le prototype!

        return;
    }
    else {
        //un objet normal, binde les property
        /*var keys = Object.keys(obj);
        var key_count = keys.length;*/
        //while (key_count--){
        for (obj_k in obj){
        //        var obj_k = keys[key_count];
    		if (typeof obj[obj_k] == "function" || obj_k.substr(0,1) == '_')continue;
                

    		//cree le binding, ie, cree une nouvelle property pour l'objet
    		//non enumerable
                var old = obj[obj_k];

    		Object.defineProperty(obj, "__"+obj_k,{
    			value : obj[obj_k],
    			enumerable:false,
    			writable:true
    		});

    		//change la property pour mettre en place le notifydatasetchanged
    		//cree une cl? de la forme className_propName

    		//probleme prop_key change, probleme closure
    		__define_property(obj, obj_k);

			//(obj);

           //Si une valeur, binde la valeur
            if(obj[obj_k]!= undefined){
			//("binding de "+obj_k);
                defineBindObject(obj[obj_k]);
                if (obj[obj_k]!= undefined && obj[obj_k].AddToOwners)  obj[obj_k].AddToOwners(obj, obj_k);
            }
    	}
    }


}




//definie une property pour un objet a lier
//INTERNAL
//@param obj: l'instance de l'objet a lier
//@param obj_k: nom de la property a lier
function __define_property(obj, obj_k){
	Object.defineProperty(obj,obj_k,{
			get : function(){
				return this["__"+obj_k];
			},
			set : function(value){

                                //experimental !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                                var old = this["__"+obj_k];
                                if (value != null ) defineBindObject(value);


                                if (old != null && old.RemoveFromOwners) old.RemoveFromOwners(this,obj_k);
                                if (value!= null && value.AddToOwners) value.AddToOwners(this, obj_k);
                                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

				this["__"+obj_k] = value;
			}
		});
}


        