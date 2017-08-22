<?php
/*
Plugin Name: Related Posts example
Description: Attach related posts/custom post types to a post. Mostly a client side solution, this file is just a sample.
Author: @willj
*/

function rps_enqueue_scripts($hook){
    if ('post-new.php' == $hook || 'post.php' == $hook){
        wp_enqueue_script( 'rps_posts_script', plugins_url( 'relatedposts.js', __FILE__ ), array('jquery') );    
        wp_enqueue_style( 'rps_posts_css', plugins_url('relatedposts.css', __FILE__) );
    }    
}
add_action( 'admin_enqueue_scripts', 'rps_enqueue_scripts' );


function rps_add_meta_boxes()
{
    add_meta_box( 'rps-related-posts', 'Related Posts', 'rps_display_related_posts', 'post', 'normal' );
}
add_action( 'add_meta_boxes', 'rps_add_meta_boxes' );


function rps_display_related_posts($post){
    // Get existing values
    $values = get_post_custom( $post->ID ); 

    // Each value is an array of values, we'll assume there's only ever one with this name.
    $related_id_1 = isset( $values['_rps_posts_related_id_1'] ) ? esc_attr( $values['_rps_posts_related_id_1'][0] ) : 0;
    $related_id_2 = isset( $values['_rps_posts_related_id_2'] ) ? esc_attr( $values['_rps_posts_related_id_2'][0] ) : 0;
    $related_id_3 = isset( $values['_rps_posts_related_id_3'] ) ? esc_attr( $values['_rps_posts_related_id_3'][0] ) : 0;
    $related_id_4 = isset( $values['_rps_posts_related_id_4'] ) ? esc_attr( $values['_rps_posts_related_id_4'][0] ) : 0;

    wp_nonce_field( plugin_basename( __FILE__ ), 'rps_posts_nonce' );

    echo '<input type="hidden" value="' . $related_id_1 . '" id="rps_related_id_1" name="_rps_posts_related_id_1" >';   
    echo '<input type="hidden" value="' . $related_id_2 . '" id="rps_related_id_2" name="_rps_posts_related_id_2" >';   
    echo '<input type="hidden" value="' . $related_id_3 . '" id="rps_related_id_3" name="_rps_posts_related_id_3" >';   
    echo '<input type="hidden" value="' . $related_id_4 . '" id="rps_related_id_4" name="_rps_posts_related_id_4" >';   

    /*
        See script tags below:
        You should call this in the jQuery doc ready as below
        The script expects a hidden text box for each post, this should contain the current value, and will contain the new value
        Then set the restUrl, and initiate the plugin by passing the hidden text box ids, in the order you want them displayed
        The final argument is the post type rest endpoint 
        https://developer.wordpress.org/rest-api/
        so 'posts', 'pages' or any custom post type as defined by the 'rest_base' param value used to register the post type 
        'show_in_rest' must also be set to true for custom post types
        The javascript file will render the interface, load existing posts and provide search functionality (via the WP REST API) 
        to attach new posts.
    */

    echo '<script>';
    echo '  jQuery(document).ready(function(){';
    echo '      window.rps.restUrl = "' . get_rest_url() . '";';
    echo '      var fieldArray = ["rps_related_id_1","rps_related_id_2","rps_related_id_3","rps_related_id_4"];';
    echo '      window.rps.initSearchInterface(fieldArray, "rps-posts-wrapper", "posts");';
    echo '  });';
    echo '</script>';

    echo '<div id="rps-posts-wrapper"></div>';

    echo '<input name="save" type="submit" class="button button-primary button-large" value="Save">';
}

function rps_save_related_posts($post_id){
    // Don't save an autosave
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }

    // Check the nonce
    if ( !isset($_POST['rps_posts_nonce']) ||  !wp_verify_nonce( $_POST['rps_posts_nonce'], plugin_basename( __FILE__ ) ) ){
        return;
    }

    // Check for edit permissions
    if($_POST['post_type'] == "post" && current_user_can( 'edit_post', $post_id )) 
    {                
        update_post_meta($post_id, "_rps_posts_related_id_1", (int)sanitize_text_field($_POST['_rps_posts_related_id_1']));
        update_post_meta($post_id, "_rps_posts_related_id_2", (int)sanitize_text_field($_POST['_rps_posts_related_id_2']));
        update_post_meta($post_id, "_rps_posts_related_id_3", (int)sanitize_text_field($_POST['_rps_posts_related_id_3']));
        update_post_meta($post_id, "_rps_posts_related_id_4", (int)sanitize_text_field($_POST['_rps_posts_related_id_4']));
    }
}
add_action( 'save_post', 'rps_save_related_posts' );

?>