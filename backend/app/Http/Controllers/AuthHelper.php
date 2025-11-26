<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class AuthHelper
{
    /**
     * Get current user ID from session
     */
    public static function getCurrentUserId()
    {
        return session('user_id');
    }

    /**
     * Get current user data from session
     */
    public static function getCurrentUser()
    {
        return [
            'id' => session('user_id'),
            'email' => session('user_email'),
            'name' => session('user_name')
        ];
    }

    /**
     * Check if user is authenticated
     */
    public static function check()
    {
        return session()->has('user_id');
    }

    /**
     * Logout user
     */
    public static function logout()
    {
        session()->forget(['user_id', 'user_email', 'user_name']);
    }
}


