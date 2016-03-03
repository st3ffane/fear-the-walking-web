/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

 
*/

/*le binding par defaut, remplace les données de la property bindée par
le nouvelle valeur
*/
function __prop_binding(infos){
    if (infos == null) return;
    //initialisations pas glop, serait mieux si init a vide...
    this._path = infos.path; 			//getDomPath(this._element, infos.root);
    this.to=infos.to;				//nom de la property a binder, par defaut setValue?
    this.from = infos.from;			//nom de la datas (ou path) a binder
    
    
    this.mode = infos.mode;			//choix one_way, 2 way si input?
    this.converter = infos.converter;	        //pour convertir les donn�es en ce qu'on veut
    this._converter_params = null;		//parametres pour le converter
    this._fallback = null;			//quoi afficher par defaut
    
    this.converter_params = infos.converter_params;//des parametres optionnels pour le converter TODO
    this.fallback = infos.fallback;		//si la valeur est null (ou invalide?), ce qui doit etre afficher

        

    this.alt = infos.alt;			//liaison a d'autres property
    this.root = infos.root;			//l'element root du binding
    this._element = infos._element;		//element html a binder (peut se trouver dans un model!!!)

    this._key_uuid_ = null;			//je m'en sert encore de ca???
    
    

	
}
__prop_binding.prototype = {
        get converter_params(){return this._converter_params;},
        set converter_params(value){
                if (value==null) this._converter_params = null;
                //split la chaine en un tableau de parametres
                else if (value[0]=='[' && value[value.length-1]==']'){
                        
                        value = value.substring(1, value.length-1);
                        this._converter_params = [];
                        vs = value.split(",");
                        for (vp=0;vp<vs.length;vp++){
                            p=vs[vp];
                            this._converter_params.push(__unstringify(p));
                        }
                }

                else {
                    //un seul parametre...
                    this._converter_params = __unstringify(value);
                }
        },
        
        get fallback(){return this._fallback;},
        set fallback(value){this._fallback = __unstringify(value);}
};

//initialisation du binding au besoin
__prop_binding.prototype.init = function (context){
        //rien ici...
}
//nettoyage du binding: rien ici
__prop_binding.prototype._clean = function (){}
//Recupere le nom de toutes les property a surveiller pour la mise
//a jour de ce binding
//PROBLEME: appel a cette méthode a chaque mise a jour des données, il faudrait mettre le resultat en cache?                  ====> TODO
//@param infos: les informations de binding
//@return array: les noms de property a surveiller (from, alts et converter_params)
__prop_binding.prototype.getBindingKeys = function(infos){

        var infos = infos || this;
        //gestion du 'alt' ------------------------------------------------
        var keys = infos.alt;
        if(keys) keys = keys.split(',');
        else keys = [];


        //si des parametres de converter, bind aussi....
        if(this.converter_params != null){
            var ci = this.converter_params.length;
            var p = null;
            while(ci--){
            //for (ci=0;ci<this.converter_params.length;ci++){
                p = this.converter_params[ci];
                if (p[0]=='$'){
                    p=p.substring(1);
                    keys.push(p);//ajoute a la liste, pas acces au context pour l'instant...
                }
            }
        }


        keys.push(infos.from);//ajoute le from qd meme!

        return keys;
    }

//met a jour le contenu du binding
//@param value: la valeur a afficher (peut etre null)
//@param context: le context de données courant
//@param extra: des parametres en plus (non utilisé pour l'instant)
__prop_binding.prototype.populate = function(value, context, extra){

        if(value == null) value = this.fallback;
        value = this.convert_value (value, context);

        this._element[this.to] = value;
        this._key_uuid_ = context.__uuid__+":"+this.from;

    }

 
//convertie la valeur passée au populate en fonction du converter et de ses
//parametres
//@param value: la valeur a convertir
//@param context: le context de données courant
//@param return: la valeur convertie
__prop_binding.prototype.convert_value=function(value, context){
        //au cas ou des params commencant par $
        
        if (this.converter!=null)
	{
            
            var p = null;//pour stocker les valeurs courantes des parametres...
            var cp = null, key=null, keys = null, v = null;
            
            if(this.converter_params != null){
                    
                if (Array.isArray(this.converter_params)){
                    p = [];
                    var cpi = this.converter_params.length;
                    
                    while(cpi--){                    
                        cp = this.converter_params[cpi];
                            
                        if (cp[0]=='$'){
                            key = cp.slice(1);

                            v = context;
                            keys = key.split('.');
                            if (keys[0] == "global") {
                                v = CONTEXT;//passe en context global
                                keys = keys.slice(1);//et supprime global de la liste
                            }
                            
                            for (var k = 0, e=keys.length; k<e;k++){
                                k=keys[k];
                                if (k in v) v= v[k];
                                else {
                                    v = null;
                                    break;
                                }
                            }
                            p.push(v);//ajoute la valeur trouvée!

                        } else {p.push(cp);}
                    }
                } else {
                    //un seul parametre passé
                    cp = this.converter_params;
                    if (cp[0]=='$'){

                        key = cp.slice(1);

                        if(key in context){
                            p = context[key];//recupere la valeur actuelle, mais doit se tenir informé des modifs
                        }
                    }else {p=cp;}
                }
            }
		//la methode: si commence par ftw2:, une methode du framework
                if (this.converter.startsWith("ftw2:")){
                        converter = this.converter.substr(5);
                        //appel a la methode
                        value = eval(converter)(value,p);
                } else {
                        //considere que la methode se trouve en portée globale.
                        //OU oblige a la creer dans le context de données global?????                                   ==> TODO
                        
                        
                        if (this.converter in CONTEXT && CONTEXT[this.converter] instanceof Function) value = CONTEXT[this.converter](value,p);
                        else value = window[this.converter](value,p); 
                }
	}
        return value;
    }

//@deprecated
__prop_binding.prototype.clone = function(root){
        //cree un nouveau binding lié au root element
        infos = {};
        for(k in this._infos){
                infos[k]=this._infos[k];
        }
        //autorise le process event
        infos["process_event"] = true;
        //recupere l'element html a partir du root
        ////("INFOS PATH: "+this._path);
        infos._element = root.querySelector(this._path);

        ////("root of element");
        ////(infos._element);
        return __create_binding_from_infos(infos);

	}


        
        
        