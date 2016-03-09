//permet de faire un pool de modifications a apporter au DOM
// en utilisant un requestAnimationFrame (pour controler qd cela se produit et 
//combien de temps on lui laisse pour le faire
//inspiration: fastdom par Wilson Page <wilsonpage@me.com> et Kornel Lesinski <kornel.lesinski@ft.com>


//une commande pour le dom batch, permet de savoir quoi faire (append, insert, modifie un attribut....)
//liste chainée (doublement?)
function dom_batch_command (arguments){
        this._next = null; //pour ma chaine, permet de connaitre le suivant sur la liste        
        this._params = arguments;//les parametres, depend de l'action, un simple tableau avec:
        //0: l'action a realiser (append,...)
        //1...n: les parametres necessaires
}
var BATCH_RECYCLE = [];
function batch_optain(){
        var tmp = null;
        if (BATCH_RECYCLE.length>0){
                tmp = BATCH_RECYCLE.pop();
                tmp._params = arguments;
        }
        else tmp = new dom_batch_command(arguments);
        return tmp;               
}
function batch_recycle(b){ 
        b._next = null;
        b._params = null;
        BATCH_RECYCLE.push(b); 
}
//qqs actions basiques
var BATCH_APPEND = 0;//params: parent, child
var BATCH_REMOVE = 1;//params: parent, child
var BATCH_INSERT_BEFORE = 2;//params: parent, child, reference
var BATCH_SET_ATTRIBUTE = 3;//params: node, attribute name, attribute value
var BATCH_SET_PROPERTY = 4;//params: node, propery name, property value
//...



function dom_batch ( ){
        this.dom_batch_budget = 10; //le temps en millisecondes pour effectuer une mise a jour du dom
                //si il reste des updates, on le fera dans une prochaine frame...
        this.raf_called = false;
        
        //@debug
        this.infos = function(){
                return "INFOS: called:"+this.raf_called;
        }
        
        //pour le timer
        this.performance = window.performance || {};
        this.performance.now = performance.now       ||
                performance.mozNow    ||
                performance.msNow     ||
                performance.oNow      ||
                performance.webkitNow ||            
                Date.now  ;/*none found - fallback to browser default */

        //les buffers pour suppression d'un element, ajout d'une element
        /*this.dom_batch_suppress = [];
        this.dom_batch_append = [];
        this.dom_batch_inserts = [];*/
        this._commands = null;
        this._last = null;//pour ajouter facilement les commandes

        this.append_command = function (cmd){
                if (this._last!=null) {
                        this._last._next = cmd;
                } else {
                        this._commands = cmd;
                }
                this._last = cmd;
                
        }
        //les methodes a appeller en place de appendChild et removeChild
        //ajoute a la queue et demande la mise a jour dans prochaine frame
        this.dom_batch_removeChild = function(parent, child){
                
                //cree une nouvelle commande
                var cmd = batch_optain(BATCH_REMOVE,parent, child);
                //ajoute a la liste
                this.append_command(cmd);
                this.update_dom();//demande la mise a jour si possible
        }
        this.dom_batch_append_child = function(parent, child){
                var cmd =batch_optain(BATCH_APPEND,parent, child);
                this.append_command(cmd);
                this.update_dom();//demande la mise a jour si possible
        }
        this.dom_batch_insertBefore = function(parent, child, before){
                var cmd = batch_optain(BATCH_INSERT_BEFORE,parent, child, before);
                this.append_command(cmd);
                this.update_dom();//demande la mise a jour si possible
        }
        this.dom_batch_set_attribute = function(node, attr_name, attr_value){
                var cmd = batch_optain(BATCH_SET_ATTRIBUTE,node, attr_name, attr_value);
                this.append_command(cmd);
                this.update_dom();//demande la mise a jour si possible
        }
        this.dom_batch_set_property = function(node, p_name, p_value){
                var cmd = batch_optain(BATCH_SET_PROPERTY,node, p_name, p_value);
                this.append_command(cmd);
                this.update_dom();//demande la mise a jour si possible
        }
        
        
        this.update_dom=function(force){
                if (!this.raf_called || force){
                        this.raf_called = true;
                        r_a_f(dom_batch_update_dom);
                }
        }
        
};
r_a_f =  window.requestAnimationFrame //normal
          || win.webkitRequestAnimationFrame  //webkit
          || win.mozRequestAnimationFrame //firefox old
          || function(callback) { return setTimeout(callback, 16); }; //16ms = 60fps, le budget conseillé pour une webapp, si requestAF non dispo
//la méthode de mise a jour du dom
function dom_batch_update_dom (delay){
                
                var batch = _dom_batch_;
                var cmds = batch._commands;
                if (!cmds) return;
                
                
                var start = batch.performance.now();//le debut de l'update en ms
                var last = batch.dom_batch_budget;
                
                //supprime d'abords
                while (last>0 && cmds!=null){
                        var task = cmds._params;
                        var tmp = cmds;
                        cmds = cmds._next;
                        
                        batch_recycle(tmp);
                        
                        var action = task[0];
                        //suivant l'action, possible d'eviter le switch en ayant le nom de la fonction?
                        switch(action){
                                case 0:
                                {
                                        //append
                                        task[1].appendChild(task[2]);
                                        break;
                                }
                                case 1:
                                {
                                        task[1].removeChild(task[2]);
                                        break;
                                }
                                case 2:
                                {
                                        task[1].insertBefore(task[2],task[3]);
                                        break;
                                }
                                case 3:
                                {
                                        task[1].setAttribute(task[2], task[3]);
                                        break;
                                }
                                case 4:
                                {
                                        task[1][task[2]]=task[3];
                                        break;
                                }
                                default: break;
                        }
                        last -= _dom_batch_.performance.now() - start;
                }
                
                batch._commands = cmds;
                //si il en reste, prochaine frame
                if (cmds!=null) _dom_batch_.update_dom(true);//demande la mise a jour
                //sinon, fini!
                else {
                        //console.log(_dom_batch_.infos());
                        batch._last = null;
                        batch._commands = null;
                        _dom_batch_.raf_called=false;
                }
                
}
var _dom_batch_ = new dom_batch();
