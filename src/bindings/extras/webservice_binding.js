//--require model_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  webservice_binding.js: revoir un peu tout ca...

*/


var __webservice_param_regex = new RegExp(/([\w_-]+)=(\??\$\w[\w_\d]+)/g);
function __webservice_parameter(name,value){
        //suivant le cas....
        this.name = name;
        this.value = value;//le nom de la propriete
        this.important = true;//par defaut, doit etre valide
        
        if (value.startsWith("$")) this.value = value.substr(1);
        else {
                this.value = value.substr(2);
                this.important = false;
        }
}
__webservice_parameter.prototype.getParameter = function(context){
        value = context[this.value];
        if (value == null){
                if( this.important) throw Error();
                else return this.name+"=";
        }
        
        return this.name+"="+encodeURI(value);
}
__webservice_parameter.prototype.toString = function(){return this.value;}//renvoie le  nom du parametre de binding



function __webservice_url (url){
        //recupere les infos a partir de l'URL:
        //la cibe, les parametres
        this._url =  url;
        
        this._params = [];//liste des parametres pour l'url (binding)
        this._param_str = "";//les parametres autres de l'url (sans binding)
        
        //recupere la premiere position du ? pour les parametres
        var params_pos = url.indexOf("?");
        if(params_pos != -1){
                //recupere le corps de l'URL
                this._url = url.substr(0,params_pos);
                param_str = url.substr(params_pos+1);//unqiement les parametres...
                match = __webservice_param_regex.exec(param_str);
                if (match){
                        params = [];
                        pi = 0;
                        while (match){
                                //recupere le nom du parametre et sa valeur: nom de la propriété
                                str = match[0];
                                name = match[1];
                                value = match[2];
                                this._params.push(new __webservice_parameter(name, value));
                                
                                //??? doit supprimer aussi les & de la requete
                                param_str = param_str.replace(str,"{"+pi+"}");
                                pi++;
                                //supprime de la chaine de parametres
                                
                                __webservice_param_regex.lastIndex = 0;//remet a zero pour leprochain coup
                                match = __webservice_param_regex.exec(param_str);
                        }
                        
                        
                        this._param_str = param_str;
                        
                    }
        }           

}
__webservice_url.prototype.getURL = function(context){
        //cree l'url avec les données du context
        //ajouter les & entre parametres?
        try{
                url = this._url;
                //ajoute les parametres
                if (this._param_str.length>0){
                        url+="?";
                        str = this._param_str;
                        for (upi=0;upi<this._params.length;upi++){
                                v = this._params[upi].getParameter(context);
                                str = str.replace("{"+upi+"}",v);
                        }
                        
                        url+= str;
                
                }
                return url;
        } catch(Error){  return null;}
};
__webservice_url.prototype.getParametersNames = function(){
        //renvoie la liste des parametres sous forme de string csv
        return this._params.join(",");
}


//Recuperation des datas depuis un service web (renvoyant du JSON)
//Les erreurs: timeout et loaderror
//l'objet AJAX lui meme 
var xhr_timeout = 4000;//4 secondes avant annulation de la requete XHR

//data-type: le webservice est en train de charger....
function WEBSERVICE_LOADING (msg){ this.message = msg;}
//oups.
function WEBSERVICE_ERROR (err){
        this.message=""+err;
}
//trop long
function WEBSERVICE_TIMEOUT (err){
        this.message = ""+err;
}


function __load_async_datas ( url, context, prop, key){
          var xhr = new XMLHttpRequest();
          context[prop] = new WEBSERVICE_LOADING();
          context.notifyDatasetChanged(key,1);
                      
                      
          xhr.onload = function(e){
            if(xhr.status !== 200) {
                      //erreur serveur, voir a permettre de la renvoyer???
                      context[prop] = new WEBSERVICE_ERROR(xhr.responseText);
                      context.notifyDatasetChanged(key,1);
                      return;
                }
            
            datas = xhr.response;
            
            if (datas == null){
                    context[prop] = null ;
                    context.notifyDatasetChanged(key,1);
                    return;
            }
            
            //recupere le content type de la requete, si json, recupere l'objet directement
            //MAIS si renseigne un reader aussi, decider quoi faire
            type = xhr.getResponseHeader("content-type");
            if (type.startsWith("application/json")){
                    //parse le contenu JSON
                    try{                                
                                datas = JSON.parse(datas);
                        } catch(Error){
                                datas  = new WEBSERVICE_ERROR("Erreur lors du parse JSON");
                        }
                        
            } else if(this.reader){
                    datas = window[this.reader](datas);
            } 
           //sinon, assume simple string?
           context[prop] = datas ;
           context.notifyDatasetChanged(key,1);
                    
          };
        
            xhr.onerror = function(err){
                    //("une erreur");
                    //(err);
                context[prop] = new WEBSERVICE_ERROR(err);
                context.notifyDatasetChanged(key,1);
            };
        
          
        xhr.timeout = xhr_timeout;
        xhr.ontimeout = function(err){
                context[prop] = new WEBSERVICE_TIMEOUT(err);
                context.notifyDatasetChanged(key,1);
        };
            
          

          xhr.open('GET', url);
          xhr.send();
}




function __webservice_model_binding (infos){
        
        __model_binding.call(this,infos);
        this.reader =  infos.reader;
        if (this.from.startsWith("http://")==true || this.from.startsWith("https://")==true){
            
            this._url = new __webservice_url(this.from);//recupere les infos de l'URL
            this.from = infos.as || generateUUID();//le nom de la propriete: as: si a besoin de la recuperer dans le code
            this._prop_name = "_"+this.from;
            
            
            //ajoute les parametres au alt pour etre prevenu d'un changement
            var params = this._url.getParametersNames();
            if(params){
                if (this.alt == undefined){
                        this.alt = params;
                } else {
                       this.alt += ","+params;
                }
            }
   
            
    } 
}
__webservice_model_binding.prototype = new __model_binding();
__webservice_model_binding.prototype.init = function(context){
        if (this._url != undefined){
                if (context[this._prop_name]==undefined){
                        //cree la prop et le setter
                        context[this._prop_name] = null;
                        var prop_name = this._prop_name;
                        
                        Object.defineProperty(context,this.from,{
                           get: function(){
                                   
                                   return this[prop_name];}
                        });
                }
                
        }
}
__webservice_model_binding.prototype.populate = function(value, context, extra){
        //ici, populate relance la requete ajax
        if (extra){
                //populate normal
                __model_binding.prototype.populate.call(this, value, context);
                
        } else {
                //chargement des données
                url = this._url.getURL(context);
                if (url) __load_async_datas (url, context, this._prop_name, this.from);
        }
}
    
    